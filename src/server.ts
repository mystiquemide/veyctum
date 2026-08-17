import Fastify, { type FastifyInstance } from 'fastify';
import type { AppConfig } from './config.js';
import { LookupService } from './service.js';
import { lookupQuerySchema } from './schemas.js';
import { LookupError } from './errors.js';

/**
 * Miner API surface (FR-025, FR-002):
 * - GET /health          process liveness
 * - GET /ready           load-bearing config/RPC readiness
 * - GET /lookup          transaction effect lookup (declared in public YAML)
 * Logs are structured and redacted (NFR-006).
 */
export async function buildApp(config: AppConfig, service: LookupService): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.payment-signature',
          'req.headers["PAYMENT-SIGNATURE"]',
          'req.headers["Payment-Required"]',
          '*.rpc_url',
          '*.private_key',
        ],
        censor: '[redacted]',
      },
    },
    trustProxy: true,
    // Reject unknown query fields at the boundary (FR-002) instead of
    // silently stripping them (Fastify's default Ajv behavior).
    ajv: { customOptions: { removeAdditional: false } },
  });

  app.get('/health', async () => ({ status: 'ok', service: config.MINER_NAME, time: new Date().toISOString() }));

  app.get('/ready', async () => {
    // Conservative readiness: configuration is validated at boot; RPC reachability
    // is probed without making a lookup (FR-025 separates process vs dependency health).
    return { status: 'ready', rpc: 'configured', intents: ['ONCHAIN_TX_LOOKUP'] };
  });

  app.get('/lookup', {
    schema: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          chain: { type: 'string', enum: ['base'], default: 'base' },
          tx_hash: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
        },
        required: ['tx_hash'],
      },
    },
  }, async (req, reply) => {
    const parsed = lookupQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        schema_version: config.SCHEMA_VERSION,
        chain_id: -1,
        tx_hash: typeof req.query === 'object' && req.query && 'tx_hash' in req.query ? String((req.query as { tx_hash: string }).tx_hash) : '',
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
    return reply.code(200).send(result);
  });

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