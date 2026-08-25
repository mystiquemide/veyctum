import { z } from 'zod';

/**
 * Public request contract (FR-002, FR-003).
 * Only `tx_hash` is required. `chain` is an OPTIONAL, lenient hint: Veyctum
 * auto-detects the chain from the tx_hash regardless (the Engine cannot be
 * trusted to pass the correct chain), so an unrecognized hint must never reject
 * an otherwise scoreable request. Unknown *fields* are still rejected (strict).
 */
export const lookupQuerySchema = z
  .object({
    chain: z
      .string()
      .min(1)
      .optional()
      .describe('Optional chain hint; the chain is auto-detected from tx_hash regardless.'),
    tx_hash: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, 'tx_hash must be a 32-byte EVM transaction hash')
      .describe('EVM transaction hash'),
    format: z
      .enum(['answer', 'full'])
      .optional()
      .describe('Response shape: "answer" (default, answer-first) or "full" (structured LookupResult).'),
  })
  .strict();

export type LookupQuery = z.infer<typeof lookupQuerySchema>;
