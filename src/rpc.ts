import {
  createPublicClient,
  http,
  TransactionNotFoundError,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { LookupError } from './errors.js';
import type { AppConfig } from './config.js';
import { normalizeAddr } from './domain.js';
import { buildEnabledChains, type ChainDef } from './chains.js';

export interface TxFacts {
  txHash: Address;
  blockNumber: bigint | null;
  blockHash: Address | null;
  from: Address;
  to: Address | null;
  value: bigint;
  /** Raw calldata, used to classify the tx and decode the called method. */
  input: Hex;
  status: 'success' | 'reverted' | null;
  logs: Array<{
    address: Address;
    topics: Hex[];
    data: Hex;
    logIndex: number;
    blockHash: Address | null;
    transactionHash: Address;
  }>;
}

export interface ProviderView {
  provider: string;
  chain: string;
  chainId: number;
  nativeSymbol: string;
  facts: TxFacts;
  head: bigint;
}

export interface ChainReadiness {
  name: string;
  ok: boolean;
  chain_id: number | null;
  head: string | null;
  detail?: string;
}

export interface ReadinessReport {
  ok: boolean;
  chains: ChainReadiness[];
}

interface ChainClients {
  def: ChainDef;
  primary: PublicClient;
  fallback: PublicClient;
}

/**
 * Multi-chain RPC gateway (FR-005, ADR-005). Each enabled chain keeps an
 * independent primary + fallback client; critical facts (including the chain id
 * each provider actually serves) must agree before any result is trusted.
 * `lookupAnyChain` auto-detects which chain a tx lives on because the Engine
 * cannot be trusted to pass the correct chain.
 */
export class RpcGateway {
  private readonly chains = new Map<string, ChainClients>();
  private readonly timeoutMs: number;
  private readonly budgetMs: number;

  constructor(cfg: AppConfig) {
    this.timeoutMs = cfg.RPC_TIMEOUT_MS;
    this.budgetMs = cfg.LOOKUP_BUDGET_MS;
    for (const def of buildEnabledChains(cfg.ENABLED_CHAINS.split(','))) {
      this.chains.set(def.name, {
        def,
        primary: createPublicClient({
          chain: def.viemChain,
          transport: http(def.rpcPrimary, { timeout: cfg.RPC_TIMEOUT_MS, retryCount: 1 }),
        }),
        fallback: createPublicClient({
          chain: def.viemChain,
          transport: http(def.rpcFallback, { timeout: cfg.RPC_TIMEOUT_MS, retryCount: 1 }),
        }),
      });
    }
  }

  get enabledChainNames(): string[] {
    return [...this.chains.keys()];
  }

  /** Fetch tx + receipt + head + chain id from one provider with a bounded timeout. */
  private async fetchOne(
    client: PublicClient,
    provider: string,
    def: ChainDef,
    hash: Address,
  ): Promise<ProviderView> {
    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`provider ${def.name}/${provider} timed out`)), this.timeoutMs),
    );
    const work = (async (): Promise<ProviderView> => {
      const [head, chainId, tx, receipt] = await Promise.all([
        client.getBlockNumber(),
        client.getChainId(),
        client.getTransaction({ hash }),
        client.getTransactionReceipt({ hash }).catch(() => null),
      ]);
      if (!tx) {
        throw new LookupError('NOT_FOUND', `transaction not found on ${def.name}/${provider}`);
      }
      const logs = (receipt?.logs ?? []).map((l) => ({
        address: normalizeAddr(l.address),
        topics: l.topics as Hex[],
        data: l.data,
        logIndex: l.logIndex,
        blockHash: l.blockHash as Address | null,
        transactionHash: normalizeAddr(l.transactionHash),
      }));
      return {
        provider,
        chain: def.name,
        chainId,
        nativeSymbol: def.nativeSymbol,
        facts: {
          txHash: normalizeAddr(tx.hash),
          blockNumber: tx.blockNumber,
          blockHash: tx.blockHash as Address | null,
          from: normalizeAddr(tx.from),
          to: tx.to ? normalizeAddr(tx.to) : null,
          value: tx.value,
          input: tx.input,
          status: receipt?.status ?? null,
          logs,
        },
        head,
      };
    })();
    try {
      return await Promise.race([work, timeout]);
    } catch (err) {
      if (err instanceof LookupError) throw err;
      if (err instanceof TransactionNotFoundError) {
        throw new LookupError('NOT_FOUND', `transaction not found on ${def.name}/${provider}`);
      }
      throw new LookupError(
        'UPSTREAM_ERROR',
        `${def.name}/${provider} fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Two-provider agreement on a single named chain. */
  private async lookupOnChain(
    name: string,
    hash: Address,
  ): Promise<{ primary: ProviderView; fallback: ProviderView }> {
    const c = this.chains.get(name);
    if (!c) throw new LookupError('UNSUPPORTED', `chain ${name} is not enabled`);
    const settle = await Promise.allSettled([
      this.fetchOne(c.primary, 'primary', c.def, hash),
      this.fetchOne(c.fallback, 'fallback', c.def, hash),
    ]);
    const [p, f] = settle;
    const ok = settle.filter((s) => s.status === 'fulfilled');
    if (ok.length === 0) {
      const errors = settle.map((s) => (s as PromiseRejectedResult).reason);
      const allNotFound = errors.every((e) => e instanceof LookupError && e.code === 'NOT_FOUND');
      if (allNotFound) throw new LookupError('NOT_FOUND', `transaction not found on ${name}`);
      throw new LookupError('UPSTREAM_ERROR', `both ${name} RPC providers failed`);
    }
    if (ok.length === 1) {
      throw new LookupError(
        'RPC_DISAGREEMENT',
        `only one ${name} provider responded; independent agreement required`,
      );
    }
    const a = (p as PromiseFulfilledResult<ProviderView>).value;
    const b = (f as PromiseFulfilledResult<ProviderView>).value;
    if (a.chainId !== b.chainId) {
      throw new LookupError('RPC_DISAGREEMENT', `chain id disagreement on ${name}: ${a.chainId} vs ${b.chainId}`);
    }
    if (a.chainId !== c.def.id) {
      throw new LookupError('UNSUPPORTED', `providers for ${name} report chain id ${a.chainId}, expected ${c.def.id}`);
    }
    if (!factsAgree(a.facts, b.facts)) {
      throw new LookupError('RPC_DISAGREEMENT', `critical facts conflict between ${name} providers`);
    }
    return { primary: a, fallback: b };
  }

  /**
   * Auto-detect the chain a transaction lives on: search every enabled chain in
   * parallel and return the one that holds the tx with two-provider agreement.
   * A `hint` (if enabled) is tried first for ordering only; it never filters.
   */
  async lookupAnyChain(
    hash: Address,
    hint?: string,
  ): Promise<{ chain: string; primary: ProviderView; fallback: ProviderView }> {
    const start = Date.now();
    const names = this.enabledChainNames;
    const ordered = hint && this.chains.has(hint) ? [hint, ...names.filter((n) => n !== hint)] : names;
    const settled = await Promise.allSettled(ordered.map((n) => this.lookupOnChain(n, hash)));
    for (let i = 0; i < settled.length; i++) {
      const s = settled[i]!;
      if (s.status === 'fulfilled') {
        if (Date.now() - start > this.budgetMs) {
          throw new LookupError('UPSTREAM_ERROR', 'lookup exceeded total budget');
        }
        return { chain: ordered[i]!, ...s.value };
      }
    }
    const reasons = settled.map((s) => (s as PromiseRejectedResult).reason);
    const allNotFound = reasons.every((e) => e instanceof LookupError && e.code === 'NOT_FOUND');
    if (allNotFound) {
      throw new LookupError('NOT_FOUND', `transaction not found on any enabled chain (${ordered.join(', ')})`);
    }
    throw new LookupError('UPSTREAM_ERROR', `no chain returned an independent agreed result (${ordered.join(', ')})`);
  }

  /** Bounded per-chain readiness probe (chain id + head) for every enabled chain. */
  async check(): Promise<ReadinessReport> {
    const entries = [...this.chains.entries()];
    const chains = await Promise.all(
      entries.map(async ([name, c]): Promise<ChainReadiness> => {
        const timeout = new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('readiness probe timed out')), this.timeoutMs),
        );
        const work = (async (): Promise<ChainReadiness> => {
          const [head, chainId] = await Promise.all([c.primary.getBlockNumber(), c.primary.getChainId()]);
          return { name, ok: chainId === c.def.id, chain_id: chainId, head: head.toString() };
        })();
        try {
          return await Promise.race([work, timeout]);
        } catch (err) {
          return { name, ok: false, chain_id: null, head: null, detail: err instanceof Error ? err.message : String(err) };
        }
      }),
    );
    // Ready if we can serve at least one enabled chain; per-chain detail is reported.
    return { ok: chains.length > 0 && chains.some((c) => c.ok), chains };
  }
}

/** Critical facts that must agree across providers (FR-005). */
function factsAgree(a: TxFacts, b: TxFacts): boolean {
  return (
    a.blockNumber === b.blockNumber &&
    a.blockHash === b.blockHash &&
    a.from === b.from &&
    a.to === b.to &&
    a.value === b.value &&
    a.input === b.input &&
    a.status === b.status &&
    a.logs.length === b.logs.length &&
    a.logs.every((l, i) => {
      const r = b.logs[i];
      return (
        !!r &&
        l.address === r.address &&
        l.data === r.data &&
        l.logIndex === r.logIndex &&
        l.topics.length === r.topics.length &&
        l.topics.every((t, j) => t === r.topics[j])
      );
    })
  );
}
