/**
 * Veyctum domain constants and shared types (branch 2: observed-effect miner).
 * The Miner returns observed normalized facts; the consumer owns expectation
 * comparison and the protected-action gate (DEC-002).
 */

import type { Address, Hex } from 'viem';

export const BASE_CHAIN_ID = 8453;
export const BASE_CHAIN_NAME = 'base';

/** Circle USDC on Base mainnet. Official source:
 * https://developers.circle.com/stablecoins/usdc-contract-addresses
 * Allowlisted by address only (FR-007, BR-003). */
export const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

export const TRANSFER_TOPIC0 =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/** RPC providers return lowercase addresses; viem's getAddress would throw on
 * them. Internal normalization is lowercase; display checksums are applied at
 * the boundary only. */
export const normalizeAddr = (a: string): Address => a.toLowerCase() as Address;

export const normalizeHash = (h: string): `0x${string}` => h.toLowerCase() as `0x${string}`;

export const DEFAULT_SCHEMA_VERSION = '1.0.0';

export type LookupState =
  | 'NOT_FOUND'
  | 'REVERTED'
  | 'PENDING'
  | 'NO_SUPPORTED_TRANSFER'
  | 'AMBIGUOUS'
  | 'RPC_DISAGREEMENT'
  | 'UNSUPPORTED'
  | 'INVALID_INPUT'
  | 'UPSTREAM_ERROR'
  | 'OK';

export interface TransferEffect {
  /** Allowlisted token contract address (checksummed). */
  token: string;
  /** Semantic sender from the Transfer log's indexed `from` (BR-004). */
  sender: string;
  recipient: string;
  /** Raw integer amount in token base units (BR-002 exact equality). */
  raw_amount: string;
  /** Evidence references (FR-008). Log block hash may be absent (REV-005). */
  log_index: number;
  block_hash: string | null;
  tx_hash: string;
}

export interface FinalityInfo {
  required_confirmations: number;
  confirmations: number | null;
  reached: boolean;
}

export interface Evidence {
  block_number: string | null;
  block_hash: string | null;
  tx_from: string | null;
  tx_to: string | null;
  value_wei: string | null;
  receipt_status: string | null;
  provider: string;
  fetched_at?: string;
}

export interface LookupResult {
  schema_version: string;
  chain_id: number;
  tx_hash: string;
  state: LookupState;
  status: 'success' | 'reverted' | 'pending' | 'not_found' | 'error';
  /** Canonical-format compatibility string (chain|tx|status|block|from|to|value);
   * null when finality/status is not determinable (canonical.ts). */
  canonical?: string | null;
  finality: FinalityInfo;
  effects: TransferEffect[];
  evidence: Evidence;
  error_code?: string;
  error_detail?: string;
}