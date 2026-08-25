import { describe, expect, it, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/server.js';
import { LookupService } from '../src/service.js';
import { ConsumerStore } from '../src/consumerStore.js';
import type { ReadinessReport } from '../src/rpc.js';
import type { LookupResult } from '../src/domain.js';

const HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';

/** Service stub that simulates a healthy per-chain probe without network. */
class HealthyService extends LookupService {
  constructor() {
    super(loadConfig({}));
  }

  override async readiness(): Promise<ReadinessReport> {
    return { ok: true, chains: [{ name: 'base', ok: true, chain_id: 8453, head: '50101720' }] };
  }
}

/** Service stub that simulates an unreachable per-chain probe without network. */
class DownService extends LookupService {
  constructor() {
    super(loadConfig({}));
  }

  override async readiness(): Promise<ReadinessReport> {
    return { ok: false, chains: [{ name: 'base', ok: false, chain_id: null, head: null, detail: 'probe timed out' }] };
  }
}

class CannedService extends HealthyService {
  override async lookup(): Promise<LookupResult> {
    return {
      schema_version: '1.0.0',
      chain: 'base',
      chain_id: 8453,
      tx_hash: HASH,
      state: 'OK',
      status: 'success',
      summary: 'Base transaction confirmed and succeeded.',
      method: { selector: '0xa9059cbb', name: 'transfer', signature: 'transfer(address,uint256)', source: 'local', kind: 'contract_call' },
      from: '0x4506de02071dcd46a22638aab6cd19e57e252e22',
      to: '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db',
      native_symbol: 'ETH',
      native_value: '0',
      sender_is_recipient: false,
      canonical: 'base|0xabc|confirmed_success|1|0xfrom|0xto|0',
      finality: { required_confirmations: 2, confirmations: 10, reached: true },
      effects: [],
      evidence: { block_number: '1', block_hash: '0xbh', tx_from: '0xfrom', tx_to: '0xto', value_wei: '0', receipt_status: 'success', provider: 'primary' },
    };
  }
}

async function makeApp(service?: LookupService, env: Record<string, string> = {}) {
  const config = loadConfig({ RATE_LIMIT_PER_SEC: '1000', CONSUMER_DB_PATH: ':memory:', CONSUMER_AUTH_REQUIRED: 'false', ...env });
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

  it('GET / returns a judge quickstart instead of a framework 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.json().endpoints.full).toContain('format=full');
  });

  it('full lookup mode preserves answer and structured facts', async () => {
    const { app: fullApp } = await makeApp(new CannedService());
    const res = await fullApp.inject({ method: 'GET', url: `/lookup?tx_hash=${HASH}&format=full` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.answer).toBe(body.summary);
    expect(body.state).toBe('OK');
  });

  it('GET /ready returns ready with per-chain reachability when the probe passes (FR-025/REV-003)', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ready');
    const base = body.chains.find((c: { name: string }) => c.name === 'base');
    expect(base.chain_id).toBe(8453);
    expect(base.head).toBe('50101720');
    expect(body.intents).toContain('ONCHAIN_TX_LOOKUP');
  });

  it('GET /ready returns 503 when no enabled chain is reachable (FR-025/REV-003)', async () => {
    const { app: downApp } = await makeApp(new DownService());
    const res = await downApp.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.status).toBe('unready');
    const base = body.chains.find((c: { name: string }) => c.name === 'base');
    expect(base.ok).toBe(false);
    expect(base.chain_id).toBeNull();
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

  it('GET /lookup accepts a chain hint but still validates tx_hash (hermetic)', async () => {
    // ethereum hint passes the schema; the malformed hash is rejected before any RPC call.
    const res = await app.inject({ method: 'GET', url: '/lookup?chain=ethereum&tx_hash=0x1234' });
    expect(res.statusCode).toBe(400);
    expect(res.json().state).toBe('INVALID_INPUT');
  });

  it('GET /lookup does not echo coerced non-string tx_hash (REV-007)', async () => {
    const res = await app.inject({ method: 'GET', url: '/lookup?tx_hash[]=x' });
    expect(res.statusCode).toBe(400);
    expect(res.json().tx_hash).toBe('');
  });

  it('accepts >1KB POST bodies on /consumer (REV-011 bodyLimit)', async () => {
    // >1 KB transport body with invalid action_id: bodyLimit must let it
    // through and validation must reject it (400), not a 413.
    const big = {
      action_id: 'bad id with spaces',
      expected: {
        chain_id: 8453,
        token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        sender: '0x2192bc3b4028acc1113f2cd9ac2cba70c36520db',
        recipient: '0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59',
        raw_amount: '237440081636',
      },
      _pad: 'x'.repeat(2048),
    };
    const res = await app.inject({
      method: 'POST',
      url: '/consumer/actions',
      payload: big,
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('INVALID_INPUT');
  });

  it('protects consumer routes when consumer auth is enabled', async () => {
    const { app: protectedApp } = await makeApp(new HealthyService(), {
      CONSUMER_AUTH_REQUIRED: 'true',
      CONSUMER_API_KEY: 'test-consumer-key-1234567890',
    });
    const denied = await protectedApp.inject({ method: 'GET', url: '/consumer/actions' });
    expect(denied.statusCode).toBe(401);
    const allowed = await protectedApp.inject({
      method: 'GET',
      url: '/consumer/actions',
      headers: { 'x-consumer-api-key': 'test-consumer-key-1234567890' },
    });
    expect(allowed.statusCode).toBe(200);
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
