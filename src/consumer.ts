import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  compareEffect,
  expectedEffectSchema,
  type CompareReason,
  type ExpectedEffect,
} from './comparator.js';
import { ConsumerStore, ConsumerError } from './consumerStore.js';
import { BASE_CHAIN_ID, type LookupResult, type TransferEffect } from './domain.js';
import type { AppConfig } from './config.js';

/**
 * Thin consumer proof gate (FR-020 spirit; the release decision is driven by a
 * real lookup result). The verify endpoint accepts the Veyctum /lookup result
 * (which itself required real two-provider Base data) plus optional Telegraph
 * signal metadata; the comparator decides and the store transitions atomically.
 * Direct Miner calls remain labeled diagnostics; the release path additionally
 * requires a signal hash (BR-007).
 */

const actionIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'action_id must be 1-64 chars of [A-Za-z0-9_-]');

const createBodySchema = z.object({
  action_id: actionIdSchema,
  expected: expectedEffectSchema,
});

const verifyBodySchema = z.object({
  // The observed lookup result from Veyctum /lookup (state + effects + evidence).
  lookup_result: z.object({
    state: z.string(),
    effects: z.array(
      z.object({
        token: z.string(),
        sender: z.string(),
        recipient: z.string(),
        raw_amount: z.string(),
        log_index: z.union([z.number(), z.string()]),
        block_hash: z.union([z.string(), z.null()]),
        tx_hash: z.string(),
      }),
    ),
  }),
  // Telegraph x402 signal metadata (BR-007).
  signal_hash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'signal_hash must be a 64-hex hash')
    .optional(),
  miner_id: z.string().max(64).optional(),
});

const RETRYABLE_STATES = new Set([
  'PENDING',
  'NOT_FOUND',
  'RPC_DISAGREEMENT',
  'UPSTREAM_ERROR',
  'INVALID_INPUT',
]);
const DEFINITIVE_FAILURE_STATES = new Set(['REVERTED']);

export function registerConsumerRoutes(
  app: FastifyInstance,
  config: AppConfig,
  store: ConsumerStore,
): void {
  app.post('/consumer/actions', async (req, reply) => {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_INPUT',
        detail: 'body must contain action_id and a frozen expected effect',
        issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    const { action_id, expected } = parsed.data;
    try {
      const action = store.createAction(action_id, expected);
      return reply.code(201).send({ action });
    } catch (err) {
      if (err instanceof ConsumerError) {
        return reply.code(409).send({ error: err.code, detail: err.message });
      }
      throw err;
    }
  });

  app.get('/consumer/actions', async () => {
    return { actions: store.listActions() };
  });

  app.get('/consumer/actions/:actionId', async (req, reply) => {
    const { actionId } = req.params as { actionId: string };
    const action = store.getAction(actionId);
    if (!action) return reply.code(404).send({ error: 'ACTION_NOT_FOUND', detail: actionId });
    return { action, attempts: store.getAttempts(actionId) };
  });

  app.post('/consumer/actions/:actionId/verify', async (req, reply) => {
    const { actionId } = req.params as { actionId: string };
    const parsed = verifyBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_INPUT',
        detail: 'body must contain lookup_result (and signal_hash to release)',
      });
    }
    const action = store.getAction(actionId);
    if (!action) return reply.code(404).send({ error: 'ACTION_NOT_FOUND', detail: actionId });

    const expected: ExpectedEffect = {
      chain_id: BASE_CHAIN_ID,
      token: action.token,
      sender: action.sender,
      recipient: action.recipient,
      raw_amount: action.raw_amount,
    };
    const { lookup_result, signal_hash, miner_id } = parsed.data;
    const effects = lookup_result.effects as TransferEffect[];

    // Map the miner state to a consumer verdict before comparing effects.
    let verdict: { matched: boolean; outcome: 'RELEASED' | 'REJECTED' | 'LOCKED'; reason: string };
    if (DEFINITIVE_FAILURE_STATES.has(lookup_result.state)) {
      verdict = {
        matched: false,
        outcome: 'REJECTED',
        reason: `execution failed (${lookup_result.state}); expected payment did not occur`,
      };
    } else if (RETRYABLE_STATES.has(lookup_result.state)) {
      verdict = {
        matched: false,
        outcome: 'LOCKED',
        reason: `retryable verification state ${lookup_result.state}; action remains locked (FR-018)`,
      };
    } else {
      const cmp = compareEffect(expected, effects);
      const reasonOf = (r: CompareReason): string =>
        r === 'MATCHED'
          ? 'exact expected transfer effect observed; releasing protected action'
          : `semantic mismatch (${r}): ${cmp.detail}`;
      verdict = {
        matched: cmp.matched,
        outcome: cmp.matched ? 'RELEASED' : 'REJECTED',
        reason: reasonOf(cmp.reason),
      };
    }

    try {
      const { action: updated, refusedDuplicate } = store.resolveAction(actionId, {
        matched: verdict.matched,
        outcome: verdict.outcome,
        reason: verdict.reason,
        signalHash: verdict.outcome === 'RELEASED' ? signal_hash : undefined,
        minerId: miner_id,
        evidence: {
          lookup_state: lookup_result.state,
          effects: lookup_result.effects,
          signal_hash: signal_hash ?? null,
        },
      });
      return reply.code(200).send({
        action: updated,
        verdict: { matched: verdict.matched, outcome: verdict.outcome, reason: verdict.reason },
        refused_duplicate: refusedDuplicate,
      });
    } catch (err) {
      if (err instanceof ConsumerError) {
        if (err.code === 'SIGNAL_REQUIRED') {
          return reply.code(422).send({ error: err.code, detail: err.message });
        }
        return reply.code(409).send({ error: err.code, detail: err.message });
      }
      throw err;
    }
  });
}

/** Normalize a raw lookup result into the shape the consumer route accepts. */
export function toLookupResult(input: LookupResult | Record<string, unknown>): LookupResult | null {
  if (!input || typeof input !== 'object') return null;
  const maybe = input as Partial<LookupResult>;
  if (typeof maybe.state !== 'string' || !Array.isArray(maybe.effects)) return null;
  return input as LookupResult;
}