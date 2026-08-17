import { describe, expect, it, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/server.js';
import { LookupService } from '../src/service.js';
import { USDC_CONTRACT } from '../src/domain.js';

const HASH = '0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7';
const USDC = USDC_CONTRACT.toLowerCase();

// Deterministic fixture: the real Base mainnet USDC transfer used in CP-001.
function makeRealisticService(): LookupService {
  const svc = new LookupService(loadConfig({}));
  return svc;
}

describe('server surface (FR-025, FR-002)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp(loadConfig({}), makeRealisticService());
  });

  it('GET /health returns process liveness', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('veyctum');
  });

  it('GET /ready separates process vs dependency readiness', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ready');
    expect(res.json().intents).toContain('ONCHAIN_TX_LOOKUP');
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
});

describe('lookup states against real Base mainnet RPC (integration, FR-005/FR-010)', () => {
  const svc = makeRealisticService();

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
});