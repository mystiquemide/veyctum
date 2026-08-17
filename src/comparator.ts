import { z } from 'zod';
import { BASE_CHAIN_ID } from './domain.js';
import type { TransferEffect } from './domain.js';
import { aggregateEffects } from './normalize.js';

/**
 * Pure expectation comparator (FR-011..FR-014, DEC-002 branch 2).
 * Owns NO side effects and NO I/O: given a frozen expectation and observed
 * normalized effects it returns a deterministic verdict. The consumer gate
 * transitions protected actions from this verdict.
 */

export const expectedEffectSchema = z.object({
  // The expectation is frozen to the configured Base environment (FR-004/FR-015).
  chain_id: z.literal(BASE_CHAIN_ID, {
    error: `chain_id must be ${BASE_CHAIN_ID} (Base mainnet)`,
  }),
  ...({
    token: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'token must be a valid EVM address'),
    sender: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'sender must be a valid EVM address'),
    recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'recipient must be a valid EVM address'),
    // Positive raw integer amount in token base units (BR-002, BR-005):
    // no leading zeros, no zero, no negatives, no floats.
    raw_amount: z
      .string()
      .regex(/^[1-9][0-9]*$/, 'raw_amount must be a positive integer string (no decimals, no zero)'),
  } satisfies Record<string, z.ZodTypeAny>),
});

export type ExpectedEffect = z.infer<typeof expectedEffectSchema>;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type CompareReason =
  | 'MATCHED'
  | 'NO_EFFECT'
  | 'ZERO_AMOUNT'
  | 'SELF_TRANSFER'
  | 'MINT_OR_BURN'
  | 'WRONG_TOKEN'
  | 'WRONG_SENDER'
  | 'WRONG_RECIPIENT'
  | 'WRONG_AMOUNT'
  | 'AMBIGUOUS';

export interface CompareVerdict {
  matched: boolean;
  /** Public machine-readable reason; free-form detail for the audit trail. */
  reason: CompareReason;
  detail: string;
}

const norm = (a: string): string => a.toLowerCase();

/**
 * Compare a frozen expectation against observed normalized effects.
 * Exact equality only; any uncertainty votes NO (BR-006).
 */
export function compareEffect(expected: ExpectedEffect, effects: TransferEffect[]): CompareVerdict {
  if (effects.length === 0) {
    // Approval-only, no-transfer, or unsupported-token transactions land here.
    // Execution succeeded but the expected payment effect is absent (FR-013).
    return {
      matched: false,
      reason: 'NO_EFFECT',
      detail: 'transaction produced no supported transfer effect matching the frozen expectation',
    };
  }

  const { aggregated, ambiguous } = aggregateEffects(effects);
  if (ambiguous) {
    // Multiple distinct (token, sender, recipient) triples: cannot prove which
    // (if any) was the intended payment (FR-013 -> reject ambiguous candidates).
    return {
      matched: false,
      reason: 'AMBIGUOUS',
      detail: `multiple distinct transfer triples observed (${aggregated.length})`,
    };
  }

  const candidate = aggregated[0];
  if (!candidate) {
    return { matched: false, reason: 'NO_EFFECT', detail: 'no transfer effects to compare' };
  }

  const amount = BigInt(candidate.raw_amount);
  const expectedAmount = BigInt(expected.raw_amount);

  if (norm(candidate.sender) === ZERO_ADDRESS || norm(candidate.recipient) === ZERO_ADDRESS) {
    return { matched: false, reason: 'MINT_OR_BURN', detail: 'transfer is a mint or burn (zero-address leg)' };
  }
  if (amount === 0n) {
    return { matched: false, reason: 'ZERO_AMOUNT', detail: 'transfer amount is zero (BR-005)' };
  }
  if (norm(candidate.sender) === norm(candidate.recipient)) {
    return { matched: false, reason: 'SELF_TRANSFER', detail: 'sender equals recipient (BR-005)' };
  }
  if (norm(candidate.token) !== norm(expected.token)) {
    return {
      matched: false,
      reason: 'WRONG_TOKEN',
      detail: `token ${candidate.token} does not match expected ${expected.token}`,
    };
  }
  if (norm(candidate.sender) !== norm(expected.sender)) {
    return {
      matched: false,
      reason: 'WRONG_SENDER',
      detail: `sender ${candidate.sender} does not match expected ${expected.sender}`,
    };
  }
  if (norm(candidate.recipient) !== norm(expected.recipient)) {
    return {
      matched: false,
      reason: 'WRONG_RECIPIENT',
      detail: `recipient ${candidate.recipient} does not match expected ${expected.recipient}`,
    };
  }
  if (amount !== expectedAmount) {
    return {
      matched: false,
      reason: 'WRONG_AMOUNT',
      detail: `amount ${candidate.raw_amount} does not match expected ${expected.raw_amount} (exact integer equality, BR-002)`,
    };
  }

  return {
    matched: true,
    reason: 'MATCHED',
    detail: `finalized transfer ${candidate.raw_amount} ${candidate.token} → ${candidate.recipient} matches the frozen expectation`,
  };
}