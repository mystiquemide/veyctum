import { describe, expect, it } from 'vitest';
import type { MethodInfo } from '../src/domain.js';
import { buildSummary } from '../src/summary.js';

const method = (over: Partial<MethodInfo> = {}): MethodInfo => ({
  selector: '0x540abf73',
  name: 'bridgeERC20To',
  signature: 'bridgeERC20To(address,address,uint256,uint32,bytes)',
  source: 'local',
  kind: 'contract_call',
  ...over,
});

describe('buildSummary (comprehensive answer)', () => {
  it('a contract call names method, contract, sender, block and call classification', () => {
    const s = buildSummary({
      chain: 'ethereum',
      txHash: '0xabc',
      status: 'success',
      method: method(),
      from: '0xfrom',
      to: '0xto',
      nativeValue: '0',
      nativeSymbol: 'ETH',
      blockNumber: '25700000',
      senderIsRecipient: false,
    });
    expect(s).toContain('bridgeERC20To');
    expect(s).toContain('on contract 0xto');
    expect(s).toContain('sent from 0xfrom');
    expect(s).toContain('block 25700000');
    expect(s.toLowerCase()).toContain('contract call');
    expect(s.toLowerCase()).toContain('succeeded');
    expect(s).toContain('0 ETH');
  });

  it('a native transfer states the value and that it is not a contract call', () => {
    const s = buildSummary({
      chain: 'ethereum',
      txHash: '0xabc',
      status: 'success',
      method: method({ selector: null, name: null, signature: null, source: 'none', kind: 'native_transfer' }),
      from: '0xfrom',
      to: '0xto',
      nativeValue: '0.5',
      nativeSymbol: 'ETH',
      blockNumber: '100',
      senderIsRecipient: false,
    });
    expect(s).toContain('0.5 ETH');
    expect(s.toLowerCase()).toContain('transfer');
    expect(s.toLowerCase()).toContain('not a contract call');
  });

  it('a reverted tx is described as reverted and reports same-address sender/recipient', () => {
    const s = buildSummary({
      chain: 'ethereum',
      txHash: '0xabc',
      status: 'reverted',
      method: method(),
      from: '0xfrom',
      to: '0xto',
      nativeValue: '0',
      nativeSymbol: 'ETH',
      blockNumber: '100',
      senderIsRecipient: true,
    });
    expect(s.toLowerCase()).toContain('reverted');
    expect(s).toContain('same address');
  });
});
