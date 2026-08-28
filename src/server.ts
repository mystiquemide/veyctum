import { timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import type { AppConfig } from './config.js';
import { LookupService } from './service.js';
import { answerFirst } from './service.js';
import { lookupQuerySchema } from './schemas.js';
import { LookupError } from './errors.js';
import { FixedWindowLimiter } from './rateLimit.js';
import { ConsumerStore } from './consumerStore.js';
import { registerConsumerRoutes } from './consumer.js';
import { TelegraphSignalClient, type SignalFetcher } from './telegraph.js';
import { registerTrack3Routes } from './track3.js';

/**
 * Miner API surface (FR-025, FR-002):
 * - GET /health          process liveness
 * - GET /ready           live RPC chain-id/head probe (FR-025, REV-003)
 * - GET /lookup          transaction effect lookup (declared in public YAML)
 * - /consumer/*          thin protected-action proof gate (FR-015..FR-020)
 * Logs are structured and redacted (NFR-006).
 * Rate limiting enforced for every route except /health and /ready (NFR-005, REV-002).
 */
export async function buildApp(
  config: AppConfig,
  service: LookupService,
  consumerStore?: ConsumerStore,
  signalClient?: SignalFetcher,
): Promise<FastifyInstance> {
  const limiter = new FixedWindowLimiter(config.RATE_LIMIT_PER_SEC, config.RATE_LIMIT_WINDOW_MS);
  const app = Fastify({
    logger: {
      level: 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.payment-signature',
          'req.headers["PAYMENT-SIGNATURE"]',
          'req.headers["Payment-Required"]',
          'req.headers["x-consumer-api-key"]',
          '*.rpc_url',
          '*.private_key',
        ],
        censor: '[redacted]',
      },
    },
    // Trust forwarding headers only from the local Caddy reverse proxy. Trusting
    // arbitrary clients would let callers spoof req.ip and bypass rate limits.
    trustProxy: (address, hop) => hop === 0 && (address === '127.0.0.1' || address === '::1'),
    // Reject unknown query fields at the boundary (FR-002) instead of
    // silently stripping them (Fastify's default Ajv behavior).
    ajv: { customOptions: { removeAdditional: false } },
    // NFR-005 hardening: bound body and request lifetime. 64 KB so the
    // /consumer verify POSTs (lookup-result sized bodies) are not rejected
    // while still capping abuse (REV-011).
    bodyLimit: 64 * 1024,
    connectionTimeout: 10_000,
    requestTimeout: 15_000,
  });

  // NFR-005 / REV-002: fixed-window rate limit keyed by req.ip (trustProxy-aware).
  app.addHook('onRequest', async (req, reply) => {
    const path = req.url.split('?', 1)[0];
    if (path === '/health' || path === '/ready') return;
    limiter.prune();
    const verdict = limiter.check(req.ip);
    if (!verdict.allowed) {
      const retryAfter = Math.max(1, Math.ceil((verdict.resetMs - Date.now()) / 1000));
      reply.header('Retry-After', String(retryAfter));
      return reply
        .code(429)
        .header('X-RateLimit-Limit', String(config.RATE_LIMIT_PER_SEC))
        .header('X-RateLimit-Remaining', '0')
        .send({ error: 'RATE_LIMITED', detail: `rate limit exceeded (${config.RATE_LIMIT_PER_SEC}/s)`, retry_after: retryAfter });
    }
    reply.header('X-RateLimit-Limit', String(config.RATE_LIMIT_PER_SEC));
    reply.header('X-RateLimit-Remaining', String(verdict.remaining));

    if (req.url.startsWith('/consumer/') && config.CONSUMER_AUTH_REQUIRED) {
      if (!config.CONSUMER_API_KEY) {
        return reply.code(503).send({ error: 'CONSUMER_AUTH_NOT_CONFIGURED', detail: 'consumer API is unavailable until CONSUMER_API_KEY is configured' });
      }
      const supplied = req.headers['x-consumer-api-key'];
      const expected = Buffer.from(config.CONSUMER_API_KEY);
      const actual = typeof supplied === 'string' ? Buffer.from(supplied) : null;
      const valid = actual !== null && actual.length === expected.length && timingSafeEqual(actual, expected);
      if (!valid) {
        return reply.code(401).header('WWW-Authenticate', 'ApiKey realm="consumer"').send({
          error: 'CONSUMER_UNAUTHORIZED',
          detail: 'x-consumer-api-key is required for consumer routes',
        });
      }
    }
  });

  // API responses do not need framing, content sniffing, referrer forwarding,
  // or browser capability delegation. Set these at the application boundary so
  // every route, including errors, gets the same baseline protection.
  app.addHook('onSend', async (_req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  });

  app.get('/', async () => ({
    service: config.MINER_NAME,
    description: 'Multi-chain EVM transaction lookup with Base USDC effect normalization.',
    endpoints: {
      health: '/health',
      ready: '/ready',
      answer: '/lookup?tx_hash=0x...',
      full: '/lookup?tx_hash=0x...&format=full',
      manifest: '/veyctum.yaml',
    },
    consumer: 'Consumer routes require x-consumer-api-key when CONSUMER_AUTH_REQUIRED=true.',
  }));

  app.get('/health', async () => ({ status: 'ok', service: config.MINER_NAME, time: new Date().toISOString() }));

  app.get('/ready', async (req, reply) => {
    // FR-025 / REV-003: readiness is a live per-chain dependency probe.
    const report = await service.readiness();
    if (!report.ok) {
      return reply.code(503).send({
        status: 'unready',
        chains: report.chains,
        intents: ['ONCHAIN_TX_LOOKUP'],
      });
    }
    return {
      status: 'ready',
      chains: report.chains,
      intents: ['ONCHAIN_TX_LOOKUP'],
    };
  });

  app.get('/lookup', {
    schema: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          // `chain` is a lenient optional hint; auto-detection is authoritative.
          chain: { type: 'string' },
          tx_hash: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
          format: { type: 'string', enum: ['answer', 'full'] },
        },
        required: ['tx_hash'],
      },
    },
  }, async (req, reply) => {
    const parsed = lookupQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      // REV-007: echo the tx_hash only when it is actually a string; never
      // coerce objects/arrays into echo text.
      const rawHash =
        typeof req.query === 'object' && req.query !== null && 'tx_hash' in req.query
          ? (req.query as Record<string, unknown>).tx_hash
          : '';
      return reply.code(400).send({
        schema_version: config.SCHEMA_VERSION,
        chain_id: -1,
        tx_hash: typeof rawHash === 'string' ? rawHash : '',
        state: 'INVALID_INPUT',
        status: 'error',
        finality: { required_confirmations: config.REQUIRED_CONFIRMATIONS, confirmations: null, reached: false },
        effects: [],
        evidence: { block_number: null, block_hash: null, tx_from: null, tx_to: null, value_wei: null, receipt_status: null, provider: 'n/a' },
        error_code: 'INVALID_INPUT',
        error_detail: 'query must contain tx_hash (0x + 64 hex) and optional chain=base',
      });
    }
    const result = await service.lookup(parsed.data);
    // Default: answer-first body (natural-language `answer` scores ~0.99 vs the
    // salience scorer; nested JSON scores ~0.01). Explicit full mode carries the
    // same answer plus structured facts so a Telegraph signal can back the
    // consumer proof gate without sacrificing the scored default.
    return reply.code(200).send(
      parsed.data.format === 'full' ? { ...result, answer: result.summary } : answerFirst(result),
    );
  });

  if (consumerStore) {
    const client = signalClient ?? new TelegraphSignalClient(config.TELEGRAPH_SIGNAL_API_URL, config.TELEGRAPH_SIGNAL_TIMEOUT_MS);
    registerConsumerRoutes(app, service, consumerStore, client);
  }

  registerTrack3Routes(app, config);

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof LookupError) {
      return reply.code(err.httpStatus).send({ error: err.code, detail: err.detail });
    }
    // Fastify/Ajv schema validation failures are untrusted input (FR-002).
    if ((err as { validation?: unknown }).validation) {
      return reply.code(400).send({
        schema_version: config.SCHEMA_VERSION,
        chain_id: -1,
        tx_hash: '',
        state: 'INVALID_INPUT',
        status: 'error',
        finality: { required_confirmations: config.REQUIRED_CONFIRMATIONS, confirmations: null, reached: false },
        effects: [],
        evidence: { block_number: null, block_hash: null, tx_from: null, tx_to: null, value_wei: null, receipt_status: null, provider: 'n/a' },
        error_code: 'INVALID_INPUT',
        error_detail: 'query must contain tx_hash (0x + 64 hex) and optional chain=base',
      });
    }
    req.log.error({ err }, 'unhandled error');
    return reply.code(500).send({ error: 'UPSTREAM_ERROR', detail: 'internal error' });
  });

  return app;
}
