import { type Address } from 'viem';
import type { AppConfig } from './config.js';
import { BASE_CHAIN_ID, normalizeAddr, type LookupResult } from './domain.js';
import { LookupError, stateToStatus, toLookupError } from './errors.js';
import { canonicalOf } from './canonical.js';
import type { ReadinessProbe } from './rpc.js';
import { aggregateEffects, normalizeEffects } from './normalize.js';
import { RpcGateway } from './rpc.js';
import type { LookupQuery } from './schemas.js';

/**
 * Lookup pipeline (FR-005, FR-006, FR-009, FR-010):
 * validate -> parallel RPC agreement -> finality -> Transfer normalization ->
 * versioned observed facts. Failures map to explicit public states; no
 * semantic decision is ever inferred (BR-001, BR-006).
 */
export class LookupService {
  private readonly rpc: RpcGateway;
  private readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.rpc = new RpcGateway(config);
  }

  /** FR-025 / REV-003: live dependency readiness probe (chain id + head). */
  async readiness(): Promise<ReadinessProbe> {
    return this.rpc.check();
  }

  async lookup(query: LookupQuery): Promise<LookupResult> {
    // Zod validated the 64-hex hash at the boundary (FR-003); treat it as opaque.
    const txHash = query.tx_hash as Address;
    try {
      const { primary } = await this.rpc.lookup(txHash);
      const facts = primary.facts;
      const required = this.config.REQUIRED_CONFIRMATIONS;
      const confirmations = facts.blockNumber === null || primary.head < facts.blockNumber
        ? null
        : primary.head - facts.blockNumber + 1n;
      const finality = {
        required_confirmations: required,
        confirmations: confirmations === null ? null : Number(confirmations),
        reached: confirmations !== null && confirmations >= BigInt(required),
      };

      const base: Omit<LookupResult, 'state' | 'status' | 'effects' | 'canonical'> = {
        schema_version: this.config.SCHEMA_VERSION,
        chain_id: BASE_CHAIN_ID,
        tx_hash: txHash,
        finality,
        evidence: {
          block_number: facts.blockNumber?.toString() ?? null,
          block_hash: facts.blockHash ?? null,
          tx_from: facts.from,
          tx_to: facts.to,
          value_wei: facts.value.toString(),
          receipt_status: facts.status,
          provider: primary.provider,
        },
      };
      const canonical = canonicalOf(facts);

      if (!finality.reached) {
        // FR-006: definitely final facts only.
        return { ...base, canonical, state: 'PENDING', status: 'pending', effects: [] };
      }

      if (facts.status === null) {
        // REV-004: the block is deep enough to be final but the receipt is still
        // unavailable on the agreed provider view (indexing lag). This is not
        // evidence of "no transfer" - keep it PENDING rather than abstaining.
        return { ...base, canonical, state: 'PENDING', status: 'pending', effects: [] };
      }

      if (facts.status === 'reverted') {
        // BR-001: execution failure is a definitive semantic failure.
        return { ...base, canonical, state: 'REVERTED', status: 'reverted', effects: [] };
      }

      const effects = normalizeEffects(facts, normalizeAddr(this.config.USDC_CONTRACT) as Address);
      if (effects.length === 0) {
        // BR-006: no supported effect -> abstention, never inferred success.
        return { ...base, canonical, state: 'NO_SUPPORTED_TRANSFER', status: 'success', effects: [] };
      }

      const { aggregated, ambiguous } = aggregateEffects(effects);
      if (ambiguous) {
        return { ...base, canonical, state: 'AMBIGUOUS', status: 'success', effects };
      }

      // A single normalized (token, sender, recipient) triple with exact
      // raw amount is the truthful observed fact bundle (FR-009); per-log
      // evidence is preserved in `effects` (FR-008). `aggregated` guards
      // triple-uniqueness above; aggregation arithmetic is exercised by tests.
      return {
        ...base,
        canonical,
        state: 'OK',
        status: 'success',
        effects,
      };
    } catch (err) {
      const e = toLookupError(err);
      return {
        schema_version: this.config.SCHEMA_VERSION,
        chain_id: BASE_CHAIN_ID,
        tx_hash: txHash,
        state: e.code,
        status: stateToStatus(e.code),
        canonical: null,
        finality: { required_confirmations: this.config.REQUIRED_CONFIRMATIONS, confirmations: null, reached: false },
        effects: [],
        evidence: { block_number: null, block_hash: null, tx_from: null, tx_to: null, value_wei: null, receipt_status: null, provider: 'n/a' },
        error_code: e.code,
        error_detail: e.detail,
      };
    }
  }
}