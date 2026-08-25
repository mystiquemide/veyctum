import { describe, expect, it } from 'vitest';
import type { TxFacts } from '../src/rpc.js';
import { buildCanonical, canonicalOf } from '../src/canonical.js';

const TX = '0x373982C25BA2C56C52C30A6DB4EA14F9AF267D6152F09F14F0B9B43E842E16A7';
const FROM = '0x4506DE02071dcd46a22638aAB6cd19E57e252e22';
const TO = '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db';

// Verity's actual canonical for the CP-001 fixture (evidence/phase1/paid/..._response.json).
const VERITY_CANONICAL_FIXTURE =
  'base|0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7|confirmed_success|50101700|0x4506de02071dcd46a22638aab6cd19e57e252e22|0x2192bc3b4028acc1113f2cd9ac2cba70c36520db|0';

function fixtureFacts(overrides: Partial<TxFacts> = {}): TxFacts {
  return {
    txHash: TX,
    blockNumber: 50101700n,
    blockHash: '0x04aa8e89337348f7d89526fa0c2f38690d3d222c1db422416dfa920a8f04baba',
    from: FROM,
    to: TO,
    value: 0n,
    input: '0x',
    status: 'success',
    logs: [],
    ...overrides,
  };
}

describe('buildCanonical (Tier A exact-match compatibility)', () => {
  it('matches Verity exactly for the shared fixture (default lowercase normalization)', () => {
    const c = buildCanonical('base', TX, 'success', 50101700n, FROM, TO, 0n);
    expect(c).toBe(VERITY_CANONICAL_FIXTURE);
  });

  it('canonicalOf(facts) produces the same Compat string', () => {
    expect(canonicalOf(fixtureFacts(), 'base')).toBe(VERITY_CANONICAL_FIXTURE);
  });

  it('uses a symmetric token for reverted execution', () => {
    const c = buildCanonical('base', TX, 'reverted', 50101700n, FROM, TO, 0n);
    expect(c).toBe(
      `base|0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7|confirmed_reverted|50101700|0x4506de02071dcd46a22638aab6cd19e57e252e22|0x2192bc3b4028acc1113f2cd9ac2cba70c36520db|0`,
    );
  });

  it('returns null when status is unknown (pending / receipt missing)', () => {
    expect(buildCanonical('base', TX, null, 50101700n, FROM, TO, 0n)).toBeNull();
  });

  it('returns null when the block number is not known', () => {
    expect(buildCanonical('base', TX, 'success', null, FROM, TO, 0n)).toBeNull();
  });

  it('renders an empty `to` field when the tx is a contract creation', () => {
    const c = buildCanonical('base', TX, 'success', 50101700n, FROM, null, 0n);
    expect(c).toBe(`base|0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7|confirmed_success|50101700|0x4506de02071dcd46a22638aab6cd19e57e252e22||0`);
  });
});