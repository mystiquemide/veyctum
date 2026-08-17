import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { LookupService } from '../src/service.js';
import { USDC_CONTRACT } from '../src/domain.js';

// Live Base mainnet integration tests (network-dependent). Excluded from the
// default `npm test` run; execute with `npm run test:integration`.
const HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';
const USDC = USDC_CONTRACT.toLowerCase();

describe('lookup states against real Base mainnet RPC (integration, FR-005/FR-010)', () => {
  const svc = new LookupService(loadConfig({}));

  it('returns OK with normalized effects for the CP-001 fixture', async () => {
    const res = await svc.lookup({ chain: 'base', tx_hash: HASH });
    expect(res.state).toBe('OK');
    expect(res.status).toBe('success');
    expect(res.chain_id).toBe(8453);
    expect(res.finality.reached).toBe(true);
    expect(res.effects.length).toBeGreaterThan(0);
    const fx = res.effects[0];
    expect(fx).toBeDefined();
    expect(fx!.token.toLowerCase()).toBe(USDC);
    expect(fx!.raw_amount).toBe('237440081636');
    expect(fx!.sender.toLowerCase()).toBe('0x2192bc3b4028acc1113f2cd9ac2cba70c36520db');
    expect(fx!.recipient.toLowerCase()).toBe('0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59');
  }, 20000);

  it('returns explicit NOT_FOUND for an unknown hash', async () => {
    const missing = '0x' + 'ff'.repeat(32) as `0x${string}`;
    const res = await svc.lookup({ chain: 'base', tx_hash: missing });
    expect(res.state).toBe('NOT_FOUND');
    expect(res.status).toBe('not_found');
  }, 20000);

  it('readiness probe reports the live Base chain id (FR-025)', async () => {
    const probe = await svc.readiness();
    expect(probe.ok).toBe(true);
    expect(probe.chain_id).toBe(8453);
    expect(probe.head).toBeTypeOf('bigint');
  }, 15000);

  it('resolves a real Telegraph signal and extracts its tx hash (REV-009)', async () => {
    const { TelegraphSignalClient } = await import('../src/telegraph.js');
    const client = new TelegraphSignalClient('https://devnode.telegraphprotocol.com/engine/v1/signal/');
    const signal = await client.fetchSignal('0xbbe9906e1e09e357e9225f0c066e9c47732539e30f8da3c9d5e56a632cad98cf');
    expect(signal).not.toBeNull();
    const { extractSignalTxHash } = await import('../src/telegraph.js');
    expect(extractSignalTxHash(signal!)).toBe(HASH.toLowerCase());
  }, 15000);

  it('returns null for an unresolvable signal hash (REV-009)', async () => {
    const { TelegraphSignalClient } = await import('../src/telegraph.js');
    const client = new TelegraphSignalClient('https://devnode.telegraphprotocol.com/engine/v1/signal/');
    const signal = await client.fetchSignal('0x' + '00'.repeat(32));
    expect(signal).toBeNull();
  }, 15000);
});