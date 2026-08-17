import { describe, expect, it } from 'vitest';
import { USDC_CONTRACT } from '../src/domain.js';
import {
  compareEffect,
  expectedEffectSchema,
  ZERO_ADDRESS,
  type ExpectedEffect,
} from '../src/comparator.js';
import type { TransferEffect } from '../src/domain.js';

const USDC = USDC_CONTRACT.toLowerCase();
const SENDER = '0x4506de02071dcd46a22638aab6cd19e57e252e22';
const RECIPIENT = '0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59';
const OTHER = '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db';
const TX_HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';

const expected: ExpectedEffect = {
  chain_id: 8453,
  token: USDC,
  sender: SENDER,
  recipient: RECIPIENT,
  raw_amount: '237440081636',
};

function effect(overrides: Partial<TransferEffect> = {}): TransferEffect {
  return {
    token: USDC,
    sender: SENDER,
    recipient: RECIPIENT,
    raw_amount: '237440081636',
    log_index: 3,
    block_hash: '0x' + 'ab'.repeat(32),
    tx_hash: TX_HASH,
    ...overrides,
  };
}

describe('expectedEffectSchema (FR-011, FR-013 input contract)', () => {
  it('accepts a frozen positive expectation', () => {
    expect(expectedEffectSchema.safeParse(expected).success).toBe(true);
  });

  it('rejects zero, negative, float, and leading-zero amounts (BR-002/BR-005)', () => {
    for (const bad of ['0', '-5', '1.5', '007', '']) {
      const r = expectedEffectSchema.safeParse({ ...expected, raw_amount: bad });
      expect(r.success).toBe(false);
    }
  });

  it('rejects a non-Base chain id (FR-004)', () => {
    const r = expectedEffectSchema.safeParse({ ...expected, chain_id: 84532 });
    expect(r.success).toBe(false);
  });

  it('rejects malformed addresses', () => {
    const r = expectedEffectSchema.safeParse({ ...expected, token: 'USDC' });
    expect(r.success).toBe(false);
  });
});

describe('compareEffect (FR-012..FR-014, BR-004..BR-006)', () => {
  it('MATCHED on exact equal effect (semantic sender from the log)', () => {
    const v = compareEffect(expected, [effect()]);
    expect(v.matched).toBe(true);
    expect(v.reason).toBe('MATCHED');
  });

  it('NO_EFFECT when the transaction has no transfer effect at all (approval-only)', () => {
    const v = compareEffect(expected, []);
    expect(v.matched).toBe(false);
    expect(v.reason).toBe('NO_EFFECT');
  });

  it('WRONG_AMOUNT on inexact amount (BR-002 exact equality; over/under both fail)', () => {
    const v = compareEffect(expected, [effect({ raw_amount: '237440081637' })]);
    expect(v.matched).toBe(false);
    expect(v.reason).toBe('WRONG_AMOUNT');
  });

  it('WRONG_RECIPIENT on a wrong beneficiary', () => {
    const v = compareEffect(expected, [effect({ recipient: OTHER })]);
    expect(v.matched).toBe(false);
    expect(v.reason).toBe('WRONG_RECIPIENT');
  });

  it('WRONG_SENDER on a wrong payer', () => {
    const v = compareEffect(expected, [effect({ sender: OTHER })]);
    expect(v.matched).toBe(false);
    expect(v.reason).toBe('WRONG_SENDER');
  });

  it('WRONG_TOKEN on a non-allowlisted token', () => {
    const v = compareEffect(expected, [effect({ token: '0x' + '11'.repeat(20) })]);
    expect(v.matched).toBe(false);
    expect(v.reason).toBe('WRONG_TOKEN');
  });

  it('ZERO_AMOUNT rejects a zero-value transfer (BR-005)', () => {
    const v = compareEffect(expected, [effect({ raw_amount: '0' })]);
    expect(v.matched).toBe(false);
    expect(v.reason).toBe('ZERO_AMOUNT');
  });

  it('SELF_TRANSFER rejects sender == recipient (BR-005)', () => {
    const v = compareEffect(expected, [effect({ recipient: SENDER })]);
    expect(v.matched).toBe(false);
    expect(v.reason).toBe('SELF_TRANSFER');
  });

  it('MINT_OR_BURN rejects zero-address legs', () => {
    const mint = compareEffect(expected, [effect({ sender: ZERO_ADDRESS })]);
    expect(mint.reason).toBe('MINT_OR_BURN');
    const burn = compareEffect(expected, [effect({ recipient: ZERO_ADDRESS })]);
    expect(burn.reason).toBe('MINT_OR_BURN');
  });

  it('AMBIGUOUS when the transaction carries multiple distinct triples (FR-013)', () => {
    const v = compareEffect(expected, [
      effect(),
      effect({ sender: OTHER, recipient: OTHER, log_index: 4 }),
    ]);
    expect(v.matched).toBe(false);
    expect(v.reason).toBe('AMBIGUOUS');
  });

  it('aggregates identical splits before matching (FR-014)', () => {
    const split = compareEffect(expected, [
      effect({ raw_amount: '100000', log_index: 0 }),
      effect({ raw_amount: '237439981636', log_index: 1 }),
    ]);
    expect(split.matched).toBe(true);
  });
});