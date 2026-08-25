import { describe, expect, it } from 'vitest';
import type { TransferEffect } from '../src/domain.js';
import {
  effectsEqual,
  extractSignalEffects,
  extractSignalTxHash,
  signalMatchesHash,
  signalMatchesTx,
  type TelegraphSignal,
} from '../src/telegraph.js';

const TX = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';
const FX: TransferEffect = {
  token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  sender: '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db',
  recipient: '0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59',
  raw_amount: '237440081636',
  log_index: 3,
  block_hash: '0x' + 'aa'.repeat(32),
  tx_hash: TX,
};

function signal(tx = TX, effects: TransferEffect[] = [FX]): TelegraphSignal {
  return {
    signal_hash: '0x' + 'bb'.repeat(32),
    payload: {
      response: { tx_hash: tx, effects },
    },
  };
}

describe('telegraph signal verification helpers (REV-009)', () => {
  it('extracts the recorded tx hash from payload.response', () => {
    expect(extractSignalTxHash(signal())).toBe(TX.toLowerCase());
  });

  it('returns null when the signal carries no tx hash', () => {
    expect(extractSignalTxHash({ payload: {} })).toBeNull();
  });

  it('extracts effects arrays and tolerates absent optional fields', () => {
    const fx = extractSignalEffects(signal());
    expect(fx).toHaveLength(1);
    expect(fx![0]).toMatchObject({
      token: FX.token,
      sender: FX.sender,
      recipient: FX.recipient,
      raw_amount: '237440081636',
    });
  });

  it('returns null for malformed effect entries', () => {
    const bad = signal();
    (bad.payload!.response!.effects as unknown[]) = [{ token: 42 }];
    expect(extractSignalEffects(bad)).toBeNull();
  });

  it('signalMatchesTx is case-insensitive', () => {
    expect(signalMatchesTx(signal(), TX)).toBe(true);
    expect(signalMatchesTx(signal(), TX.toUpperCase())).toBe(true);
    expect(signalMatchesTx(signal(), '0x' + 'ff'.repeat(32))).toBe(false);
  });

  it('requires the fetched signal identity to match the requested hash', () => {
    expect(signalMatchesHash(signal(), '0x' + 'bb'.repeat(32))).toBe(true);
    expect(signalMatchesHash(signal(), '0x' + 'cc'.repeat(32))).toBe(false);
    expect(signalMatchesHash({ payload: {} }, '0x' + 'bb'.repeat(32))).toBe(false);
  });

  it('effectsEqual is exact and order-sensitive', () => {
    expect(effectsEqual([FX], [FX])).toBe(true);
    expect(effectsEqual([FX], [FX, FX])).toBe(false);
    expect(effectsEqual([FX], [{ ...FX, raw_amount: '1' }])).toBe(false);
  });
});
