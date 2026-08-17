import { describe, expect, it } from 'vitest';
import { lookupQuerySchema } from '../src/schemas.js';

const HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';

describe('lookupQuerySchema (FR-002, FR-003)', () => {
  it('accepts a valid tx hash with default chain', () => {
    const r = lookupQuerySchema.parse({ tx_hash: HASH });
    expect(r).toEqual({ chain: 'base', tx_hash: HASH });
  });

  it('accepts explicit chain=base', () => {
    const r = lookupQuerySchema.parse({ chain: 'base', tx_hash: HASH });
    expect(r.chain).toBe('base');
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

  it('rejects non-base chains', () => {
    const r = lookupQuerySchema.safeParse({ chain: 'ethereum', tx_hash: HASH });
    expect(r.success).toBe(false);
  });
});