import { describe, expect, it } from 'vitest';
import { lookupQuerySchema } from '../src/schemas.js';

const HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';

describe('lookupQuerySchema (FR-002, FR-003)', () => {
  it('accepts a valid tx hash with no chain hint', () => {
    const r = lookupQuerySchema.parse({ tx_hash: HASH });
    expect(r).toEqual({ tx_hash: HASH });
  });

  it('accepts an explicit chain hint (base)', () => {
    const r = lookupQuerySchema.parse({ chain: 'base', tx_hash: HASH });
    expect(r.chain).toBe('base');
  });

  it('accepts a non-base chain hint (auto-detection is authoritative)', () => {
    const r = lookupQuerySchema.parse({ chain: 'ethereum', tx_hash: HASH });
    expect(r.chain).toBe('ethereum');
  });

  it('rejects a malformed hash', () => {
    const r = lookupQuerySchema.safeParse({ tx_hash: '0x1234' });
    expect(r.success).toBe(false);
  });

  it('rejects an uppercase-invalid hash', () => {
    const r = lookupQuerySchema.safeParse({ tx_hash: '0x' + 'G'.repeat(64) });
    expect(r.success).toBe(false);
  });

  it('rejects unknown fields (strict boundary)', () => {
    const r = lookupQuerySchema.safeParse({ tx_hash: HASH, extra: 1 });
    expect(r.success).toBe(false);
  });
});
