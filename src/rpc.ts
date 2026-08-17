import {
  createPublicClient,
  http,
  TransactionNotFoundError,
  type Address,
  type Hex,
  type PublicClient,
  type Transport,
} from 'viem';
import { base } from 'viem/chains';
import { BASE_CHAIN_ID } from './domain.js';
import { LookupError } from './errors.js';
import type { AppConfig } from './config.js';
import { normalizeAddr } from './domain.js';

export interface TxFacts {
  txHash: Address;
  blockNumber: bigint | null;
  blockHash: Address | null;
  from: Address;
  to: Address | null;
  value: bigint;
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
  chainId: number;
  facts: TxFacts;
  head: bigint;
}

export interface ReadinessProbe {
  ok: boolean;
  chain_id: number | null;
  head: bigint | null;
  provider: string;
  detail?: string;
}

type BaseClient = PublicClient<Transport, typeof base>;

/**
 * RPC gateway (FR-005, ADR-005): queries primary and fallback independently and
 * compares critical facts including the chain ID each provider actually serves.
 * A single provider can never support the verification claim.
 */
export class RpcGateway {
  private readonly primary: BaseClient;
  private readonly fallback: BaseClient;
  private readonly timeoutMs: number;
  private readonly budgetMs: number;

  constructor(cfg: AppConfig) {
    this.primary = createPublicClient({
      chain: base,
      transport: http(cfg.RPC_URL_PRIMARY, { timeout: cfg.RPC_TIMEOUT_MS, retryCount: 1 }),
    });
    this.fallback = createPublicClient({
      chain: base,
      transport: http(cfg.RPC_URL_FALLBACK, { timeout: cfg.RPC_TIMEOUT_MS, retryCount: 1 }),
    });
    this.timeoutMs = cfg.RPC_TIMEOUT_MS;
    this.budgetMs = cfg.LOOKUP_BUDGET_MS;
  }

  /** Fetch tx + receipt + head + chain id from one provider with a bounded timeout. */
  private async fetchOne(client: BaseClient, provider: string, hash: Address): Promise<ProviderView> {
    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`provider ${provider} timed out`)), this.timeoutMs),
    );
    const work = (async () => {
      const [head, chainId, tx, receipt] = await Promise.all([
        client.getBlockNumber(),
        client.getChainId(),
        client.getTransaction({ hash }),
        client.getTransactionReceipt({ hash }).catch(() => null),
      ]);
      if (!tx) {
        throw new LookupError('NOT_FOUND', `transaction not found on ${provider}`);
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
        chainId,
        facts: {
          txHash: normalizeAddr(tx.hash),
          blockNumber: tx.blockNumber,
          blockHash: tx.blockHash as Address | null,
          from: normalizeAddr(tx.from),
          to: tx.to ? normalizeAddr(tx.to) : null,
          value: tx.value,
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
        throw new LookupError('NOT_FOUND', `transaction not found on ${provider}`);
      }
      throw new LookupError(
        'UPSTREAM_ERROR',
        `${provider} fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Bounded readiness probe: chain id + head from the primary provider (FR-025). */
  async check(): Promise<ReadinessProbe> {
    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('readiness probe timed out')), this.timeoutMs),
    );
    const work = (async () => {
      const [head, chainId] = await Promise.all([
        this.primary.getBlockNumber(),
        this.primary.getChainId(),
      ]);
      return { ok: true, chain_id: chainId, head, provider: 'primary' };
    })();
    try {
      return await Promise.race([work, timeout]);
    } catch (err) {
      return {
        ok: false,
        chain_id: null,
        head: null,
        provider: 'primary',
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** Fetch both providers in parallel and compare critical facts including chain id. */
  async lookup(hash: Address): Promise<{ primary: ProviderView; fallback: ProviderView }> {
    const start = Date.now();
    const settle = await Promise.allSettled([
      this.fetchOne(this.primary, 'primary', hash),
      this.fetchOne(this.fallback, 'fallback', hash),
    ]);
    const primary = settle[0];
    const fallback = settle[1];
    const ok = settle.filter((s) => s.status === 'fulfilled');
    if (ok.length === 0) {
      // Every provider rejected. If all agree the tx does not exist, that IS
      // the definitive verdict; a transport/upstream failure is not.
      const errors = settle.map((s) => (s as PromiseRejectedResult).reason);
      const allNotFound = errors.every((e) => e instanceof LookupError && e.code === 'NOT_FOUND');
      if (allNotFound) throw new LookupError('NOT_FOUND', 'transaction not found on all providers');
      throw new LookupError('UPSTREAM_ERROR', 'both RPC providers failed');
    }
    if (ok.length === 1) {
      // Single provider available is retryable, not definitive (ADR-005).
      throw new LookupError(
        'RPC_DISAGREEMENT',
        `only ${ok[0] === primary ? 'primary' : 'fallback'} provider responded; independent agreement required`,
      );
    }
    const a = (primary as PromiseFulfilledResult<ProviderView>).value;
    const b = (fallback as PromiseFulfilledResult<ProviderView>).value;

    // FR-005 / REV-001: compare the chain ID each provider actually serves.
    if (a.chainId !== b.chainId) {
      throw new LookupError(
        'RPC_DISAGREEMENT',
        `chain id disagreement: primary ${a.chainId}, fallback ${b.chainId}`,
      );
    }
    if (a.chainId !== BASE_CHAIN_ID) {
      // Both providers report the same wrong chain: unsupported environment, not a
      // lookup result (FR-004/FR-010 UNSUPPORTED; REV-006 producer).
      throw new LookupError(
        'UNSUPPORTED',
        `providers report chain id ${a.chainId}, expected ${BASE_CHAIN_ID} (Base mainnet)`,
      );
    }

    if (!factsAgree(a.facts, b.facts)) {
      throw new LookupError('RPC_DISAGREEMENT', 'critical facts conflict between providers');
    }
    if (Date.now() - start > this.budgetMs) {
      throw new LookupError('UPSTREAM_ERROR', 'lookup exceeded total budget');
    }
    return { primary: a, fallback: b };
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