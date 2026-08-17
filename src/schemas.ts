import { z } from 'zod';
import { BASE_CHAIN_NAME } from './domain.js';

/**
 * Public request contract (FR-002, FR-003, FR-004).
 * Accepted shape mirrors the on-intent incumbent ({chain, tx_hash}); the chain
 * must equal the fixed Base environment or the request is rejected.
 */
export const lookupQuerySchema = z
  .object({
    chain: z
      .enum([BASE_CHAIN_NAME])
      .describe('Fixed chain name; only "base" is supported (ADR-003)')
      .default(BASE_CHAIN_NAME),
    tx_hash: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, 'tx_hash must be a 32-byte EVM transaction hash')
      .describe('EVM transaction hash'),
  })
  .strict();

export type LookupQuery = z.infer<typeof lookupQuerySchema>;