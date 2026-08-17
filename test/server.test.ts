import { describe, expect, it, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/server.js';
import { LookupService } from '../src/service.js';
import { ConsumerStore } from '../src/consumerStore.js';

const HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';

/** Service stub that simulates a healthy dependency probe without network. */
class HealthyService extends LookupService {
  constructor() {
    super(loadConfig({}));
  }

  override async readiness() {
    return { ok: true, chain_id: 8453, head: 50101720n, provider: 'primary' };
  }
}

/** Service stub that simulates an unreachable dependency probe without network. */
class DownService extends LookupService {
  constructor() {
    super(loadConfig({}));
  }

  override async readiness() {
    return { ok: false, chain_id: null, head: null, provider: 'primary', detail: 'probe timed out' };
  }
}

async function makeApp(service?: LookupService, env: Record<string, string> = {}) {
  const config = loadConfig({ RATE_LIMIT_PER_SEC: '1000', CONSUMER_DB_PATH: ':memory:', ...env });
  const store = new ConsumerStore(':memory:');
  const app = await buildApp(config, service ?? new LookupService(config), store);
  return { app, config };
}

describe('server surface (FR-025, FR-002)', () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    ({ app } = await makeApp(new HealthyService()));
  });

  it('GET /health returns process liveness', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('veyctum');
  });

  it('GET /ready returns ready with the live chain id when the probe passes (FR-025/REV-003)', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ready');
    expect(body.chain_id).toBe(8453);
    expect(body.head).toBe('50101720');
    expect(body.intents).toContain('ONCHAIN_TX_LOOKUP');
  });

  it('GET /ready returns 503 when the RPC dependency is unreachable (FR-025/REV-003)', async () => {
    const { app: downApp } = await makeApp(new DownService());
    const res = await downApp.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.status).toBe('unready');
    expect(body.chain_id_observed).toBeNull();
  });

  it('GET /lookup rejects malformed input without RPC calls (400 INVALID_INPUT)', async () => {
    const res = await app.inject({ method: 'GET', url: '/lookup?tx_hash=0x1234' });
    expect(res.statusCode).toBe(400);
    expect(res.json().state).toBe('INVALID_INPUT');
  });

  it('GET /lookup rejects unknown query fields', async () => {
    const res = await app.inject({ method: 'GET', url: `/lookup?tx_hash=${HASH}&extra=1` });
    expect(res.statusCode).toBe(400);
    expect(res.json().state).toBe('INVALID_INPUT');
  });

  it('GET /lookup rejects a non-base chain', async () => {
    const res = await app.inject({ method: 'GET', url: `/lookup?chain=ethereum&tx_hash=${HASH}` });
    expect(res.statusCode).toBe(400);
  });

  it('GET /lookup does not echo coerced non-string tx_hash (REV-007)', async () => {
    const res = await app.inject({ method: 'GET', url: '/lookup?tx_hash[]=x' });
    expect(res.statusCode).toBe(400);
    expect(res.json().tx_hash).toBe('');
  });
});

describe('rate limiting (NFR-005, REV-002)', () => {
  it('returns 429 with Retry-After after the per-second budget is spent', async () => {
    const { app } = await makeApp(new HealthyService(), { RATE_LIMIT_PER_SEC: '2' });
    const ok1 = await app.inject({ method: 'GET', url: `/lookup?tx_hash=${HASH}&extra=1` });
    const ok2 = await app.inject({ method: 'GET', url: '/lookup?tx_hash=0x1234' });
    expect(ok1.statusCode).toBe(400); // allowed (validation error, not rate)
    expect(ok2.statusCode).toBe(400);
    const limited = await app.inject({ method: 'GET', url: '/lookup?tx_hash=0x1234' });
    expect(limited.statusCode).toBe(429);
    expect(limited.json().error).toBe('RATE_LIMITED');
    expect(limited.headers['retry-after']).toBeDefined();
    // health/ready are never rate limited (monitoring must always work)
    const health = await app.inject({ method: 'GET', url: '/health' });
    expect(health.statusCode).toBe(200);
  });
});