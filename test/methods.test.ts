import { describe, expect, it } from 'vitest';
import type { Address, Hex } from 'viem';
import { classifyKind, decodeMethod, selectorOf } from '../src/methods.js';

const TO = '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1' as Address;
const arg = '00'.repeat(32);

describe('selectorOf / classifyKind', () => {
  it('extracts a 4-byte selector', () => {
    expect(selectorOf(('0x540abf73' + arg) as Hex)).toBe('0x540abf73');
  });

  it('returns null for empty calldata', () => {
    expect(selectorOf('0x' as Hex)).toBeNull();
  });

  it('classifies contract creation when to is null', () => {
    expect(classifyKind('0x60806040' as Hex, null)).toBe('contract_creation');
  });

  it('classifies a native transfer for empty calldata', () => {
    expect(classifyKind('0x' as Hex, TO)).toBe('native_transfer');
  });

  it('classifies a contract call when calldata is present', () => {
    expect(classifyKind(('0xa9059cbb' + arg) as Hex, TO)).toBe('contract_call');
  });
});

describe('decodeMethod (local signature DB, no network)', () => {
  it('decodes a known selector from the local DB', async () => {
    const m = await decodeMethod(('0x540abf73' + arg) as Hex, TO, { fourByteEnabled: false });
    expect(m.name).toBe('bridgeERC20To');
    expect(m.selector).toBe('0x540abf73');
    expect(m.source).toBe('local');
    expect(m.kind).toBe('contract_call');
  });

  it('decodes ERC-20 transfer', async () => {
    const m = await decodeMethod(('0xa9059cbb' + arg) as Hex, TO, { fourByteEnabled: false });
    expect(m.name).toBe('transfer');
  });

  it('returns the raw selector with a null name for an unknown method (4byte disabled)', async () => {
    const m = await decodeMethod(('0xdeadbeef' + arg) as Hex, TO, { fourByteEnabled: false });
    expect(m.selector).toBe('0xdeadbeef');
    expect(m.name).toBeNull();
    expect(m.source).toBe('none');
  });

  it('reports a native transfer with no method', async () => {
    const m = await decodeMethod('0x' as Hex, TO, { fourByteEnabled: false });
    expect(m.kind).toBe('native_transfer');
    expect(m.name).toBeNull();
    expect(m.selector).toBeNull();
  });
});
