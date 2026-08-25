import { describe, expect, it } from 'vitest';
import { USDC_CONTRACT, TRANSFER_TOPIC0 } from '../src/domain.js';
import { aggregateEffects, normalizeEffects } from '../src/normalize.js';
import type { TxFacts } from '../src/rpc.js';

const USDC = USDC_CONTRACT.toLowerCase() as `0x${string}`;
const SENDER = '0x4506de02071dcd46a22638aab6cd19e57e252e22' as `0x${string}`;
const RECIPIENT = '0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59' as `0x${string}`;
const OTHER = '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db' as `0x${string}`;
const TX_HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7' as `0x${string}`;
const BLOCK_HASH = ('0x' + 'ab'.repeat(32)) as `0x${string}`;

const topic = (addr: string): `0x${string}` =>
  ('0x' + '00'.repeat(12) + addr.slice(2).toLowerCase()) as `0x${string}`;

const dataFor = (value: bigint): `0x${string}` =>
  ('0x' + value.toString(16).padStart(64, '0')) as `0x${string}`;

function transferLog(opts: {
  from: string;
  to: string;
  value: bigint;
  token?: string;
  index?: number;
}): TxFacts['logs'][number] {
  return {
    address: (opts.token ?? USDC).toLowerCase() as `0x${string}`,
    topics: [TRANSFER_TOPIC0 as `0x${string}`, topic(opts.from), topic(opts.to)],
    data: dataFor(opts.value),
    logIndex: opts.index ?? 0,
    blockHash: BLOCK_HASH,
    transactionHash: TX_HASH,
  };
}

function facts(logs: TxFacts['logs']): TxFacts {
  return {
    txHash: TX_HASH,
    blockNumber: 50101700n,
    blockHash: BLOCK_HASH,
    from: OTHER,
    to: SENDER,
    value: 0n,
    input: '0x',
    status: 'success',
    logs,
  };
}

describe('normalizeEffects (FR-007, FR-008)', () => {
  it('decodes a single supported USDC Transfer log', () => {
    const log = transferLog({ from: SENDER, to: RECIPIENT, value: 237440081636n, index: 3 });
    const effects = normalizeEffects(facts([log]), USDC);
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({
      token: USDC,
      sender: SENDER,
      recipient: RECIPIENT,
      raw_amount: '237440081636',
      log_index: 3,
      tx_hash: TX_HASH,
    });
  });

  it('ignores logs from non-allowlisted tokens', () => {
    const log = transferLog({ from: SENDER, to: RECIPIENT, value: 5n, token: ('0x' + '11'.repeat(20)).toLowerCase(), index: 1 });
    expect(normalizeEffects(facts([log]), USDC)).toHaveLength(0);
  });

  it('ignores malformed Transfer data on the allowlisted token (fail-safe)', () => {
    const log = {
      ...transferLog({ from: SENDER, to: RECIPIENT, value: 1n, index: 0 }),
      data: ('0x' + 'zz') as `0x${string}`,
    };
    expect(normalizeEffects(facts([log]), USDC)).toHaveLength(0);
  });

  it('keeps block_hash null when the log has none (REV-005)', () => {
    const log = { ...transferLog({ from: SENDER, to: RECIPIENT, value: 237440081636n, index: 3 }), blockHash: null };
    const effects = normalizeEffects(facts([log]), USDC);
    expect(effects).toHaveLength(1);
    expect(effects[0]!.block_hash).toBeNull();
  });

  it('aggregates identical triples with checked arithmetic and preserves log evidence', () => {
    const a = transferLog({ from: SENDER, to: RECIPIENT, value: 100n, index: 0 });
    const b = transferLog({ from: SENDER, to: RECIPIENT, value: 200n, index: 1 });
    const { aggregated, ambiguous } = aggregateEffects(normalizeEffects(facts([a, b]), USDC));
    expect(ambiguous).toBe(false);
    expect(aggregated).toHaveLength(1);
    expect(aggregated[0]).toMatchObject({ sender: SENDER, recipient: RECIPIENT, raw_amount: '300', logs: [0, 1] });
  });

  it('marks distinct triples as ambiguous', () => {
    const a = transferLog({ from: SENDER, to: RECIPIENT, value: 100n, index: 0 });
    const b = transferLog({ from: OTHER, to: RECIPIENT, value: 100n, index: 1 });
    const { ambiguous } = aggregateEffects(normalizeEffects(facts([a, b]), USDC));
    expect(ambiguous).toBe(true);
  });
});