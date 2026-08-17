import { describe, expect, it, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/server.js';
import { LookupService } from '../src/service.js';
import { ConsumerStore } from '../src/consumerStore.js';
import { USDC_CONTRACT } from '../src/domain.js';

const USDC = USDC_CONTRACT.toLowerCase();
const SENDER = '0x4506de02071dcd46a22638aab6cd19e57e252e22';
const RECIPIENT = '0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59';
const OTHER = '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db';
const TX_HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';
const SIGNAL = '0x' + 'ab'.repeat(32);

const EXPECTED = {
  chain_id: 8453,
  token: USDC,
  sender: SENDER,
  recipient: RECIPIENT,
  raw_amount: '237440081636',
};

async function makeApp() {
  const config = loadConfig({
    RATE_LIMIT_PER_SEC: '1000', // keep rate limiting out of functional tests
    CONSUMER_DB_PATH: ':memory:',
  });
  const store = new ConsumerStore(':memory:');
  const app = await buildApp(config, new LookupService(config), store);
  return { app, store };
}

describe('consumer proof gate (FR-015..FR-020, BR-007, BR-008)', () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    ({ app } = await makeApp());
  });

  it('creates an action in LOCKED (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/consumer/actions',
      payload: { action_id: 'demo-1', expected: EXPECTED },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.action.status).toBe('LOCKED');
    expect(body.action.raw_amount).toBe('237440081636');
  });

  it('rejects an invalid frozen expectation (zero amount, bad chain)', async () => {
    const bad = await app.inject({
      method: 'POST',
      url: '/consumer/actions',
      payload: { action_id: 'demo-bad', expected: { ...EXPECTED, raw_amount: '0' } },
    });
    expect(bad.statusCode).toBe(400);
    const badChain = await app.inject({
      method: 'POST',
      url: '/consumer/actions',
      payload: { action_id: 'demo-bad2', expected: { ...EXPECTED, chain_id: 84532 } },
    });
    expect(badChain.statusCode).toBe(400);
  });

  it('releases the action once when the observed effect matches exactly (positive flow)', async () => {
    await app.inject({ method: 'POST', url: '/consumer/actions', payload: { action_id: 'pos', expected: EXPECTED } });
    const res = await app.inject({
      method: 'POST',
      url: '/consumer/actions/pos/verify',
      payload: {
        lookup_result: {
          state: 'OK',
          effects: [
            {
              token: USDC, sender: SENDER, recipient: RECIPIENT,
              raw_amount: '237440081636', log_index: 3,
              block_hash: '0x' + 'aa'.repeat(32), tx_hash: TX_HASH,
            },
          ],
        },
        signal_hash: SIGNAL,
        miner_id: 'veyctum',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.action.status).toBe('RELEASED');
    expect(body.verdict.matched).toBe(true);
    expect(body.action.released_by_signal).toBe(SIGNAL);
  });

  it('blocks a successful but wrong-recipient transaction (negative flow, THE invariant)', async () => {
    await app.inject({ method: 'POST', url: '/consumer/actions', payload: { action_id: 'neg', expected: EXPECTED } });
    const res = await app.inject({
      method: 'POST',
      url: '/consumer/actions/neg/verify',
      payload: {
        lookup_result: {
          state: 'OK', // receipt succeeded at the EVM level
          effects: [
            {
              token: USDC, sender: SENDER, recipient: OTHER,
              raw_amount: '237440081636', log_index: 3,
              block_hash: '0x' + 'aa'.repeat(32), tx_hash: TX_HASH,
            },
          ],
        },
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.action.status).toBe('REJECTED');
    expect(body.verdict.matched).toBe(false);
    expect(body.verdict.reason).toContain('WRONG_RECIPIENT');
    expect(body.action.reject_reason).toContain('WRONG_RECIPIENT');
  });

  it('rejects an approval-only transaction with no transfer effect (NO_EFFECT)', async () => {
    await app.inject({ method: 'POST', url: '/consumer/actions', payload: { action_id: 'approval', expected: EXPECTED } });
    const res = await app.inject({
      method: 'POST',
      url: '/consumer/actions/approval/verify',
      payload: { lookup_result: { state: 'NO_SUPPORTED_TRANSFER', effects: [] } },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.action.status).toBe('REJECTED');
    expect(body.verdict.reason).toContain('NO_EFFECT');
  });

  it('keeps LOCKED on retryable states (PENDING, RPC_DISAGREEMENT, NOT_FOUND)', async () => {
    await app.inject({ method: 'POST', url: '/consumer/actions', payload: { action_id: 'pend', expected: EXPECTED } });
    for (const state of ['PENDING', 'RPC_DISAGREEMENT', 'NOT_FOUND']) {
      const res = await app.inject({
        method: 'POST',
        url: '/consumer/actions/pend/verify',
        payload: { lookup_result: { state, effects: [] } },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().action.status).toBe('LOCKED');
    }
  });

  it('rejects a reverted execution (definitive failure, not retryable)', async () => {
    await app.inject({ method: 'POST', url: '/consumer/actions', payload: { action_id: 'rev', expected: EXPECTED } });
    const res = await app.inject({
      method: 'POST',
      url: '/consumer/actions/rev/verify',
      payload: { lookup_result: { state: 'REVERTED', effects: [] } },
    });
    expect(res.json().action.status).toBe('REJECTED');
    expect(res.json().verdict.reason).toContain('REVERTED');
  });

  it('requires a signal hash to release; 422 without it, verifiable after (BR-007)', async () => {
    await app.inject({ method: 'POST', url: '/consumer/actions', payload: { action_id: 'sig', expected: EXPECTED } });
    const noSignal = await app.inject({
      method: 'POST',
      url: '/consumer/actions/sig/verify',
      payload: {
        lookup_result: { state: 'OK', effects: [{ token: USDC, sender: SENDER, recipient: RECIPIENT, raw_amount: '237440081636', log_index: 3, block_hash: '0x' + 'aa'.repeat(32), tx_hash: TX_HASH }] },
      },
    });
    expect(noSignal.statusCode).toBe(422);
    const withSignal = await app.inject({
      method: 'POST',
      url: '/consumer/actions/sig/verify',
      payload: {
        lookup_result: { state: 'OK', effects: [{ token: USDC, sender: SENDER, recipient: RECIPIENT, raw_amount: '237440081636', log_index: 3, block_hash: '0x' + 'aa'.repeat(32), tx_hash: TX_HASH }] },
        signal_hash: SIGNAL,
      },
    });
    expect(withSignal.json().action.status).toBe('RELEASED');
  });

  it('refuses a duplicate release on the same action (FR-019/BR-008)', async () => {
    await app.inject({ method: 'POST', url: '/consumer/actions', payload: { action_id: 'dup', expected: EXPECTED } });
    const payload = {
      lookup_result: { state: 'OK', effects: [{ token: USDC, sender: SENDER, recipient: RECIPIENT, raw_amount: '237440081636', log_index: 3, block_hash: '0x' + 'aa'.repeat(32), tx_hash: TX_HASH }] },
      signal_hash: SIGNAL,
    };
    const first = await app.inject({ method: 'POST', url: '/consumer/actions/dup/verify', payload });
    expect(first.json().action.status).toBe('RELEASED');
    const second = await app.inject({ method: 'POST', url: '/consumer/actions/dup/verify', payload });
    expect(second.json().refused_duplicate).toBe(true);
    expect(second.json().action.status).toBe('RELEASED');
  });

  it('exposes action + audit trail (FR-019 audit entry)', async () => {
    await app.inject({ method: 'POST', url: '/consumer/actions', payload: { action_id: 'audit', expected: EXPECTED } });
    await app.inject({ method: 'POST', url: '/consumer/actions/audit/verify', payload: { lookup_result: { state: 'NO_SUPPORTED_TRANSFER', effects: [] } } });
    const res = await app.inject({ method: 'GET', url: '/consumer/actions/audit' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.action.status).toBe('REJECTED');
    expect(body.attempts.length).toBe(1);
    expect(body.attempts[0].state).toBe('REJECTED');
  });
});