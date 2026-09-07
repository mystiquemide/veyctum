import { describe, expect, it } from 'vitest';
import { Track3Ledger, getTrack3WindowState, sessionDigest } from '../src/track3.js';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/server.js';
import { LookupService } from '../src/service.js';
import { ConsumerStore } from '../src/consumerStore.js';

describe('Track 3 preparation and ledger guard', () => {
  it('keeps the application closed before the official window', () => {
    const state = getTrack3WindowState(new Date('2026-08-28T15:00:00Z'));
    expect(state.open).toBe(false);
    expect(state.reason).toBe('before_window');
  });

  it('opens only inside the official UTC window and closes after it', () => {
    expect(getTrack3WindowState(new Date('2026-08-31T00:00:00Z')).open).toBe(true);
    expect(getTrack3WindowState(new Date('2026-09-07T23:59:59Z')).open).toBe(true);
    expect(getTrack3WindowState(new Date('2026-09-08T00:00:00Z')).reason).toBe('after_window');
  });

  it('deduplicates one session and transaction in the append-only ledger', () => {
    const ledger = new Track3Ledger(':memory:');
    const session = sessionDigest('test-salt', 'session-a');
    expect(ledger.canAccept(session, '0x' + 'a'.repeat(64), 1000, 60)).toBe(true);
    ledger.record({ timestamp: '2026-08-31T00:00:00.000Z', session_digest: session, tx_hash: '0x' + 'a'.repeat(64), signal_hash: '0x' + 'b'.repeat(64), settled: true, duration_ms: 1000 });
    expect(ledger.canAccept(session, '0x' + 'a'.repeat(64), 1001, 60)).toBe(false);
    expect(ledger.count()).toBe(1);
    expect(ledger.distinctSessions()).toBe(1);
  });

  it('reserves an in-flight session and transaction only once', () => {
    const ledger = new Track3Ledger(':memory:');
    const session = sessionDigest('test-salt', 'session-concurrent');
    const txHash = '0x' + 'c'.repeat(64);
    expect(ledger.reserve(session, txHash, 1000, 60)).toBe(true);
    expect(ledger.reserve(session, txHash, 1000, 60)).toBe(false);
    ledger.release(session, txHash);
    expect(ledger.reserve(session, txHash, 1000, 60)).toBe(true);
  });

  it('exposes preparation status and refuses upstream calls while disabled', async () => {
    const config = loadConfig({
      RATE_LIMIT_PER_SEC: '1000',
      CONSUMER_DB_PATH: ':memory:',
      CONSUMER_AUTH_REQUIRED: 'false',
      TRACK3_LEDGER_PATH: ':memory:',
      TRACK3_ENABLED: 'false',
    });
    const app = await buildApp(config, new LookupService(config), new ConsumerStore(':memory:'));
    const status = await app.inject({ method: 'GET', url: '/track3/status' });
    expect(status.statusCode).toBe(200);
    expect(status.json()).toMatchObject({ mode: 'preparation', reason: 'disabled', valid_requests: 0, miner_id: 9005 });
    const refused = await app.inject({
      method: 'POST',
      url: '/track3/engine',
      payload: { tx_hash: '0x' + 'a'.repeat(64) },
    });
    expect(refused.statusCode).toBe(503);
    expect(refused.json().error).toBe('TRACK3_NOT_OPEN');
    await app.close();
  });

  it('rejects an operator payer before forwarding a paid retry', async () => {
    const config = loadConfig({
      RATE_LIMIT_PER_SEC: '1000',
      CONSUMER_DB_PATH: ':memory:',
      CONSUMER_AUTH_REQUIRED: 'false',
      TRACK3_LEDGER_PATH: ':memory:',
      TRACK3_ENABLED: 'true',
      TRACK3_EXCLUDED_PAYER_ADDRESSES: '0x65ae39fd36f2a9fa8d738a0fac369c0cdc507a99',
      TRACK3_START_AT: '2026-08-01T00:00:00.000Z',
      TRACK3_END_AT: '2026-09-30T23:59:59.999Z',
    });
    const app = await buildApp(config, new LookupService(config), new ConsumerStore(':memory:'));
    const payment = Buffer.from(JSON.stringify({ payload: { authorization: { from: '0x65Ae39Fd36f2a9Fa8d738A0FaC369c0CDc507a99' } } })).toString('base64');
    const res = await app.inject({
      method: 'POST',
      url: '/track3/engine',
      headers: { 'payment-signature': payment },
      payload: { tx_hash: '0x' + 'a'.repeat(64) },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ error: 'EXCLUDED_PAYER' });
    const status = await app.inject({ method: 'GET', url: '/track3/status' });
    expect(status.json()).toMatchObject({ operator_payer_exclusion_configured: true, valid_requests: 0 });
    await app.close();
  });

  it('serves static pages without consuming the rate limit budget', async () => {
    const config = loadConfig({
      RATE_LIMIT_PER_SEC: '1',
      RATE_LIMIT_WINDOW_MS: '1000',
      CONSUMER_DB_PATH: ':memory:',
      CONSUMER_AUTH_REQUIRED: 'false',
      TRACK3_LEDGER_PATH: ':memory:',
      TRACK3_ENABLED: 'false',
    });
    const app = await buildApp(config, new LookupService(config), new ConsumerStore(':memory:'));
    for (let i = 0; i < 6; i++) {
      const page = await app.inject({ method: 'GET', url: '/app' });
      expect(page.statusCode).toBe(200);
      expect(page.headers['content-type']).toContain('text/html');
    }
    await app.close();
  });

  it('returns 400 rather than 500 for a malformed JSON body', async () => {
    const config = loadConfig({
      RATE_LIMIT_PER_SEC: '1000',
      CONSUMER_DB_PATH: ':memory:',
      CONSUMER_AUTH_REQUIRED: 'false',
      TRACK3_LEDGER_PATH: ':memory:',
      TRACK3_ENABLED: 'true',
      TRACK3_EXCLUDED_PAYER_ADDRESSES: '0x65ae39fd36f2a9fa8d738a0fac369c0cdc507a99',
      TRACK3_START_AT: '2026-08-01T00:00:00.000Z',
      TRACK3_END_AT: '2026-09-30T23:59:59.999Z',
    });
    const app = await buildApp(config, new LookupService(config), new ConsumerStore(':memory:'));
    const res = await app.inject({
      method: 'POST',
      url: '/track3/engine',
      headers: { 'content-type': 'application/json' },
      payload: 'this is not json',
      simulate: { json: false } as never,
    });
    expect([400, 415]).toContain(res.statusCode);
    await app.close();
  });

  it('does not fail on a malformed session cookie', async () => {
    const config = loadConfig({
      RATE_LIMIT_PER_SEC: '1000',
      CONSUMER_DB_PATH: ':memory:',
      CONSUMER_AUTH_REQUIRED: 'false',
      TRACK3_LEDGER_PATH: ':memory:',
      TRACK3_ENABLED: 'false',
    });
    const app = await buildApp(config, new LookupService(config), new ConsumerStore(':memory:'));
    const res = await app.inject({
      method: 'GET',
      url: '/app',
      headers: { cookie: 'track3_session=%' },
    });
    expect(res.statusCode).toBe(200);
    await app.close();
  });

  it('reports the persisted state on a refused duplicate verify, never a fresh RELEASED verdict', async () => {
    const store = new ConsumerStore(':memory:');
    store.createAction('dup-test', {
      chain_id: 8453,
      token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      sender: '0x1111111111111111111111111111111111111111',
      recipient: '0x2222222222222222222222222222222222222222',
      raw_amount: '1000',
    });
    // Force the action into REJECTED, then attempt a "matched" resolve.
    store.resolveAction('dup-test', { matched: false, outcome: 'REJECTED', reason: 'first attempt rejected' });
    const second = store.resolveAction('dup-test', {
      matched: true,
      outcome: 'RELEASED',
      reason: 'second attempt would release',
      signalHash: '0x' + 'a'.repeat(64),
    });
    expect(second.refusedDuplicate).toBe(true);
    expect(second.action.status).toBe('REJECTED');
    // The route layer must report the persisted status, not the computed verdict.
    expect(second.action.status).not.toBe('RELEASED');
  });

  it('forwards the real Engine payment challenge without counting an unpaid request', async () => {
    const config = loadConfig({
      RATE_LIMIT_PER_SEC: '1000',
      CONSUMER_DB_PATH: ':memory:',
      CONSUMER_AUTH_REQUIRED: 'false',
      TRACK3_LEDGER_PATH: ':memory:',
      TRACK3_ENABLED: 'true',
      TRACK3_EXCLUDED_SESSION_DIGESTS: 'sha256:operator-test',
      TRACK3_START_AT: '2026-08-01T00:00:00.000Z',
      TRACK3_END_AT: '2026-09-30T23:59:59.999Z',
    });
    const app = await buildApp(config, new LookupService(config), new ConsumerStore(':memory:'));
    const res = await app.inject({ method: 'POST', url: '/track3/engine', payload: { tx_hash: '0x' + 'a'.repeat(64) } });
    expect(res.statusCode).toBe(402);
    expect(res.headers['payment-required']).toBeTruthy();
    expect(res.headers['x-track3-counted']).toBeUndefined();
    expect(res.headers['x-track3-request-count']).toBe('0');
    const ledger = await app.inject({ method: 'GET', url: '/track3/ledger.jsonl' });
    expect(ledger.statusCode).toBe(200);
    expect(ledger.body).toBe('');
    await app.close();
  });
});
