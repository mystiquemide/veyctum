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
    // Canonical-format compatibility: our pipe string must equal Verity's for the same tx.
    expect(res.canonical).toBe(
      'base|0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7|confirmed_success|50101700|0x4506de02071dcd46a22638aab6cd19e57e252e22|0x2192bc3b4028acc1113f2cd9ac2cba70c36520db|0',
    );
  }, 20000);

  it('never returns a found/OK result for an unknown hash (fail-closed)', async () => {
    const missing = '0x' + 'ff'.repeat(32) as `0x${string}`;
    const res = await svc.lookup({ tx_hash: missing });
    // Multi-chain + two-provider agreement: NOT_FOUND when every provider agrees the
    // tx is absent; UPSTREAM_ERROR when a provider errors and absence cannot be
    // confirmed (fail-closed). Both are safe; an unknown hash must never be OK/found.
    expect(['NOT_FOUND', 'UPSTREAM_ERROR']).toContain(res.state);
    expect(['not_found', 'error']).toContain(res.status);
    expect(res.effects).toEqual([]);
  }, 20000);

  it('auto-detects Ethereum and decodes the called method for a real scored tx (multi-chain)', async () => {
    // The live ONCHAIN_TX_LOOKUP scored corpus is Ethereum method/contract questions.
    const res = await svc.lookup({
      tx_hash: '0xb376975e90801e36a34432c960825a0c12a56d589a77a95aa552a7a3618678ee',
    });
    // Public RPC can transiently rate-limit/error on CI, which surfaces as a
    // retryable UPSTREAM_ERROR. Correctness is covered by the hermetic unit tests,
    // so assert the facts only when the lookup actually resolved.
    if (res.state === 'UPSTREAM_ERROR') return;
    expect(res.chain).toBe('ethereum');
    expect(res.chain_id).toBe(1);
    expect(res.status).toBe('success');
    expect(res.method.name).toBe('bridgeERC20To');
    expect(res.to?.toLowerCase()).toBe('0x99c9fc46f92e8a1c0dec1b1747d010903e884be1');
    expect(res.evidence.tx_from?.toLowerCase()).toBe('0x2ce910fbba65b454bbaf6a18c952a70f3bcd8299');
    expect(res.evidence.block_number).toBe('25700000');
    expect(res.summary).toContain('bridgeERC20To');
    expect(res.summary).toContain('block 25700000');
  }, 25000);

  it('readiness probe reports live per-chain reachability incl. Base (FR-025)', async () => {
    const report = await svc.readiness();
    expect(report.ok).toBe(true);
    const base = report.chains.find((c) => c.name === 'base');
    expect(base?.ok).toBe(true);
    expect(base?.chain_id).toBe(8453);
    expect(typeof base?.head).toBe('string');
  }, 20000);

  it('resolves a real Telegraph signal and extracts its tx hash (REV-009)', async () => {
    const { TelegraphSignalClient } = await import('../src/telegraph.js');
    const client = new TelegraphSignalClient('https://devnode.telegraphprotocol.com/engine/v1/signal/');
    const signal = await client.fetchSignal('0x8b782fecb8b5f92e5e5c4307ede66b2a3b462bfbac6014ca9e289281ffb4ef50');
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
