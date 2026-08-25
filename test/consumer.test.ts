import { describe, expect, it, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/server.js';
import { LookupService } from '../src/service.js';
import { ConsumerStore } from '../src/consumerStore.js';
import type { SignalFetcher, TelegraphSignal } from '../src/telegraph.js';
import { USDC_CONTRACT, type LookupResult, type LookupState } from '../src/domain.js';

const USDC = USDC_CONTRACT.toLowerCase();
const SENDER = '0x4506de02071dcd46a22638aab6cd19e57e252e22';
const RECIPIENT = '0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59';
const OTHER = '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db';
const TX_HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';
const SIGNAL = '0x' + 'ab'.repeat(32);

const EXPECTED = {
  chain_id: 8453,
  token: USDC,
  sender: '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db', // real semantic sender of the fixture
  recipient: RECIPIENT,
  raw_amount: '237440081636',
};

const FIXTURE_EFFECT = {
  token: USDC,
  sender: '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db',
  recipient: RECIPIENT,
  raw_amount: '237440081636',
  log_index: 3,
  block_hash: '0x' + 'aa'.repeat(32),
  tx_hash: TX_HASH,
};

/** Hermetic lookup service: canned two-provider-verified results. */
class FakeLookupService extends LookupService {
  private canned: LookupResult;
  constructor(canned: LookupResult) {
    super(loadConfig({}));
    this.canned = canned;
  }
  override async lookup(): Promise<LookupResult> {
    return this.canned;
  }
}

function okLookup(effects: unknown[] = [FIXTURE_EFFECT]): LookupResult {
  return {
    schema_version: '1.0.0',
    chain: 'base',
    chain_id: 8453,
    tx_hash: TX_HASH,
    state: 'OK',
    status: 'success',
    summary: 'base transaction confirmed and succeeded.',
    method: { selector: '0xa9059cbb', name: 'transfer', signature: 'transfer(address,uint256)', source: 'local', kind: 'contract_call' },
    from: SENDER,
    to: OTHER,
    native_symbol: 'ETH',
    native_value: '0',
    sender_is_recipient: false,
    finality: { required_confirmations: 2, confirmations: 100, reached: true },
    effects: effects as LookupResult['effects'],
    evidence: {
      block_number: '50101700', block_hash: '0x' + 'aa'.repeat(32),
      tx_from: SENDER, tx_to: OTHER, value_wei: '0', receipt_status: 'success', provider: 'primary',
    },
  };
}

function stateLookup(state: string): LookupResult {
  return {
    schema_version: '1.0.0', chain: 'unknown', chain_id: 8453, tx_hash: TX_HASH,
    state: state as LookupState, status: 'error',
    summary: 'unresolved', method: { selector: null, name: null, signature: null, source: 'none', kind: 'unknown' },
    from: null, to: null, native_symbol: 'ETH', native_value: '0', sender_is_recipient: null,
    finality: { required_confirmations: 2, confirmations: null, reached: false },
    effects: [], evidence: { block_number: null, block_hash: null, tx_from: null, tx_to: null, value_wei: null, receipt_status: null, provider: 'n/a' },
  };
}

class FakeSignalClient implements SignalFetcher {
  constructor(private readonly signals: Map<string, TelegraphSignal>) {}
  async fetchSignal(hash: string): Promise<TelegraphSignal | null> {
    return this.signals.get(hash) ?? null;
  }
}

function goodSignal(): TelegraphSignal {
  return {
    signal_hash: SIGNAL,
    payload: { response: { tx_hash: TX_HASH, effects: [FIXTURE_EFFECT] } },
  };
}

async function makeApp(opts: { lookup?: LookupResult; signals?: Map<string, TelegraphSignal> } = {}) {
  const config = loadConfig({ RATE_LIMIT_PER_SEC: '1000', CONSUMER_DB_PATH: ':memory:', CONSUMER_AUTH_REQUIRED: 'false' });
  const service = new FakeLookupService(opts.lookup ?? okLookup());
  const store = new ConsumerStore(':memory:');
  const signals = opts.signals ?? new Map([[SIGNAL, goodSignal()]]);
  const app = await buildApp(config, service, store, new FakeSignalClient(signals));
  return { app, store };
}

async function createAction(app: FastifyInstance, id: string) {
  const res = await app.inject({
    method: 'POST', url: '/consumer/actions',
    payload: { action_id: id, expected: EXPECTED },
  });
  expect(res.statusCode).toBe(201);
}

const VERIFY = (tx = TX_HASH, signal = SIGNAL) => ({
  method: 'POST' as const,
  url: `/consumer/actions/%ID%/verify`,
  payload: { tx_hash: tx, signal_hash: signal, miner_id: 'veyctum' },
});

describe('consumer proof gate, self-sufficient verify (FR-020, BR-007, REV-009)', () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    ({ app } = await makeApp());
  });

  it('releases only when the signal resolves, matches the tx, and matches observed effects', async () => {
    await createAction(app, 'pos');
    const res = await app.inject({ ...VERIFY(), url: '/consumer/actions/pos/verify' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.action.status).toBe('RELEASED');
    expect(body.verdict.matched).toBe(true);
    expect(body.action.released_by_signal).toBe(SIGNAL);
  });

  it('rejects a fabricated/unresolvable signal and keeps the action LOCKED', async () => {
    await createAction(app, 'fake');
    const res = await app.inject({
      method: 'POST', url: '/consumer/actions/fake/verify',
      payload: { tx_hash: TX_HASH, signal_hash: '0x' + 'ff'.repeat(32) },
    });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('SIGNAL_UNREACHABLE');
    const after = await app.inject({ method: 'GET', url: '/consumer/actions/fake' });
    expect(after.json().action.status).toBe('LOCKED');
  });

  it('rejects a signal that records a different transaction (SIGNAL_MISMATCH)', async () => {
    await createAction(app, 'othertx');
    const signals = new Map([[SIGNAL, { signal_hash: SIGNAL, payload: { response: { tx_hash: '0x' + 'ee'.repeat(32), effects: [FIXTURE_EFFECT] } } }]]);
    const { app: app2 } = await makeApp({ signals });
    await createAction(app2, 'othertx');
    const res = await app2.inject({ method: 'POST', url: '/consumer/actions/othertx/verify', payload: { tx_hash: TX_HASH, signal_hash: SIGNAL } });
    expect(res.statusCode).toBe(422);
    expect(res.json().error).toBe('SIGNAL_MISMATCH');
  });

  it('rejects a signal whose recorded effects disagree with the observation (SIGNAL_MISMATCH)', async () => {
    await createAction(app, 'fxmismatch');
    const signals = new Map([[SIGNAL, { signal_hash: SIGNAL, payload: { response: { tx_hash: TX_HASH, effects: [{ ...FIXTURE_EFFECT, raw_amount: '1' }] } } }]]);
    const { app: app2 } = await makeApp({ signals });
    await createAction(app2, 'fxmismatch');
    const res = await app2.inject({ method: 'POST', url: '/consumer/actions/fxmismatch/verify', payload: { tx_hash: TX_HASH, signal_hash: SIGNAL } });
    expect(res.statusCode).toBe(422);
    expect(res.json().error).toBe('SIGNAL_MISMATCH');
    const after = await app2.inject({ method: 'GET', url: '/consumer/actions/fxmismatch' });
    expect(after.json().action.status).toBe('LOCKED');
  });

  it('does not accept caller-supplied lookup_result anymore (400)', async () => {
    await createAction(app, 'oldshape');
    const res = await app.inject({
      method: 'POST', url: '/consumer/actions/oldshape/verify',
      payload: { lookup_result: { state: 'OK', effects: [FIXTURE_EFFECT] }, signal_hash: SIGNAL },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('INVALID_INPUT');
  });

  it('blocks a successful but wrong-recipient transaction (negative flow, THE invariant)', async () => {
    const { app: app2 } = await makeApp({ lookup: okLookup() });
    // expected recipient is OTHER; the observed tx pays RECIPIENT -> mismatch.
    const createWrong = await app2.inject({
      method: 'POST', url: '/consumer/actions',
      payload: { action_id: 'neg', expected: { ...EXPECTED, recipient: OTHER } },
    });
    expect(createWrong.statusCode).toBe(201);
    const res = await app2.inject({ method: 'POST', url: '/consumer/actions/neg/verify', payload: { tx_hash: TX_HASH, signal_hash: SIGNAL } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.action.status).toBe('REJECTED');
    expect(body.verdict.matched).toBe(false);
    expect(body.verdict.reason).toContain('WRONG_RECIPIENT');
    expect(body.action.reject_reason).toContain('WRONG_RECIPIENT');
  });

  it('rejects an approval-only transaction with no transfer effect (NO_EFFECT)', async () => {
    const { app: app2 } = await makeApp({ lookup: stateLookup('NO_SUPPORTED_TRANSFER'), signals: new Map([[SIGNAL, { signal_hash: SIGNAL, payload: { response: { tx_hash: TX_HASH, effects: [] } } }]]) });
    await createAction(app2, 'approval');
    const res = await app2.inject({ method: 'POST', url: '/consumer/actions/approval/verify', payload: { tx_hash: TX_HASH, signal_hash: SIGNAL } });
    expect(res.statusCode).toBe(200);
    expect(res.json().action.status).toBe('REJECTED');
    expect(res.json().verdict.reason).toContain('NO_EFFECT');
  });

  it('keeps LOCKED on retryable states (PENDING, RPC_DISAGREEMENT, NOT_FOUND)', async () => {
    for (const state of ['PENDING', 'RPC_DISAGREEMENT', 'NOT_FOUND']) {
      const { app: app2 } = await makeApp({ lookup: stateLookup(state), signals: new Map([[SIGNAL, { signal_hash: SIGNAL, payload: { response: { tx_hash: TX_HASH, effects: [] } } }]]) });
      await createAction(app2, `pend-${state}`);
      const res = await app2.inject({ method: 'POST', url: `/consumer/actions/pend-${state}/verify`, payload: { tx_hash: TX_HASH, signal_hash: SIGNAL } });
      expect(res.statusCode).toBe(200);
      expect(res.json().action.status).toBe('LOCKED');
      expect(res.json().verdict.reason).toContain(state);
    }
  });

  it('rejects a reverted execution (definitive failure, not retryable)', async () => {
    const { app: app2 } = await makeApp({ lookup: stateLookup('REVERTED'), signals: new Map([[SIGNAL, { signal_hash: SIGNAL, payload: { response: { tx_hash: TX_HASH, effects: [] } } }]]) });
    await createAction(app2, 'rev');
    const res = await app2.inject({ method: 'POST', url: '/consumer/actions/rev/verify', payload: { tx_hash: TX_HASH, signal_hash: SIGNAL } });
    expect(res.json().action.status).toBe('REJECTED');
    expect(res.json().verdict.reason).toContain('REVERTED');
  });

  it('refuses a duplicate release on the same action (FR-019/BR-008)', async () => {
    await createAction(app, 'dup');
    const payload = { tx_hash: TX_HASH, signal_hash: SIGNAL };
    const first = await app.inject({ method: 'POST', url: '/consumer/actions/dup/verify', payload });
    expect(first.json().action.status).toBe('RELEASED');
    const second = await app.inject({ method: 'POST', url: '/consumer/actions/dup/verify', payload });
    expect(second.json().refused_duplicate).toBe(true);
    expect(second.json().action.status).toBe('RELEASED');
  });

  it('exposes action + audit trail (FR-019 audit entry)', async () => {
    const { app: app2 } = await makeApp({ lookup: stateLookup('NO_SUPPORTED_TRANSFER'), signals: new Map([[SIGNAL, { signal_hash: SIGNAL, payload: { response: { tx_hash: TX_HASH, effects: [] } } }]]) });
    await createAction(app2, 'audit');
    await app2.inject({ method: 'POST', url: '/consumer/actions/audit/verify', payload: { tx_hash: TX_HASH, signal_hash: SIGNAL } });
    const res = await app2.inject({ method: 'GET', url: '/consumer/actions/audit' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.action.status).toBe('REJECTED');
    expect(body.attempts.length).toBe(1);
    expect(body.attempts[0].state).toBe('REJECTED');
  });
});
