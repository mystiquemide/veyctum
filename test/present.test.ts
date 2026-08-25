import { describe, expect, it } from 'vitest';
import { answerFirst } from '../src/service.js';
import type { LookupResult } from '../src/domain.js';

const result: LookupResult = {
  schema_version: '1.0.0',
  chain: 'ethereum',
  chain_id: 1,
  tx_hash: '0xabc',
  state: 'OK',
  status: 'success',
  summary: 'Ethereum transaction 0xabc was confirmed and succeeded. It called the bridgeERC20To method...',
  method: { selector: '0x540abf73', name: 'bridgeERC20To', signature: 'bridgeERC20To(address,address,uint256,uint32,bytes)', source: 'local', kind: 'contract_call' },
  from: '0xfrom',
  to: '0xto',
  native_symbol: 'ETH',
  native_value: '0',
  sender_is_recipient: false,
  canonical: 'ethereum|0xabc|confirmed_success|100|0xfrom|0xto|0',
  finality: { required_confirmations: 2, confirmations: 50, reached: true },
  effects: [],
  evidence: { block_number: '100', block_hash: '0xbh', tx_from: '0xfrom', tx_to: '0xto', value_wei: '0', receipt_status: 'success', provider: 'primary' },
};

describe('answerFirst projection (scored-body shape)', () => {
  it('returns ONLY the natural-language answer (the summary)', () => {
    const a = answerFirst(result) as Record<string, unknown>;
    expect(a.answer).toBe(result.summary);
    expect(Object.keys(a)).toEqual(['answer']);
  });

  it('omits every structured/hex field that dilutes the salience scorer', () => {
    const a = answerFirst(result) as Record<string, unknown>;
    for (const f of ['effects', 'evidence', 'finality', 'canonical', 'tx_hash', 'from', 'to', 'method', 'chain_id']) {
      expect(f in a).toBe(false);
    }
  });
});
