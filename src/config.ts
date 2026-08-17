import { z } from 'zod';
import {
  BASE_CHAIN_ID,
  BASE_CHAIN_NAME,
  DEFAULT_SCHEMA_VERSION,
  USDC_CONTRACT,
} from './domain.js';

/** Environment configuration, validated at bootstrap (fail fast on missing config). */
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).default(8080),
  HOST: z.string().default('0.0.0.0'),
  BASE_CHAIN_ID: z.coerce.number().int().default(BASE_CHAIN_ID),
  BASE_CHAIN_NAME: z.string().default(BASE_CHAIN_NAME),
  USDC_CONTRACT: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'USDC_CONTRACT must be a valid EVM address')
    .default(USDC_CONTRACT),
  RPC_URL_PRIMARY: z.string().url().default('https://mainnet.base.org'),
  RPC_URL_FALLBACK: z.string().url().default('https://base.drpc.org'),
  REQUIRED_CONFIRMATIONS: z.coerce.number().int().min(1).default(2),
  RPC_TIMEOUT_MS: z.coerce.number().int().min(100).default(4000),
  LOOKUP_BUDGET_MS: z.coerce.number().int().min(100).max(8000).default(8000),
  // NFR-005 / REV-002: rate limit declared in veyctum.yaml and enforced here.
  RATE_LIMIT_PER_SEC: z.coerce.number().int().min(1).max(1000).default(4),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(100).max(60000).default(1000),
  // Consumer proof gate durable store (FR-015..FR-019); ':memory:' for tests
  CONSUMER_DB_PATH: z.string().default('./data/veyctum.db'),
  // Telegraph Engine signal API used to verify release signals (BR-007, REV-009)
  TELEGRAPH_SIGNAL_API_URL: z
    .string()
    .url()
    .default('https://devnode.telegraphprotocol.com/engine/v1/signal/'),
  TELEGRAPH_SIGNAL_TIMEOUT_MS: z.coerce.number().int().min(100).max(30000).default(5000),
  MINER_NAME: z.string().default('veyctum'),
  SCHEMA_VERSION: z.string().default(DEFAULT_SCHEMA_VERSION),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const cfg = envSchema.parse(env);
  if (cfg.BASE_CHAIN_ID !== BASE_CHAIN_ID) {
    // FR-004: Miner binds to the configured Base environment only (ADR-003).
    throw new Error(`BASE_CHAIN_ID must be ${BASE_CHAIN_ID} (Base mainnet) for H1`);
  }
  return cfg;
}