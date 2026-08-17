import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  compareEffect,
  expectedEffectSchema,
  type CompareReason,
  type ExpectedEffect,
} from './comparator.js';
import { ConsumerStore, ConsumerError } from './consumerStore.js';
import { BASE_CHAIN_ID, type TransferEffect } from './domain.js';
import type { LookupService } from './service.js';
import type {
  SignalFetcher,
  TelegraphSignal,
} from './telegraph.js';
import { effectsEqual, extractSignalEffects, signalMatchesTx } from './telegraph.js';

/**
 * Consumer proof gate (FR-020, BR-007, REV-009).
 * The verify endpoint is self-sufficient: it takes only a transaction hash and
 * a Telegraph signal hash, fetches the observed effects itself through the
 * two-provider RPC gateway, resolves the signal against the Telegraph Engine
 * API, cross-checks that the signal's recorded payload matches the same
 * transaction and effect data, and only then runs the comparator and
 * transitions the protected action. Caller-supplied facts are never trusted.
 */

const actionIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'action_id must be 1-64 chars of [A-Za-z0-9_-]');

const createBodySchema = z.object({
  action_id: actionIdSchema,
  expected: expectedEffectSchema,
});

const verifyBodySchema = z.object({
  // The transaction reference to verify (the only observed input).
  tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'tx_hash must be a 64-hex hash'),
  // A real Telegraph Engine signal backing the release (BR-007).
  signal_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'signal_hash must be a 64-hex hash'),
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
  service: LookupService,
  store: ConsumerStore,
  signalClient: SignalFetcher,
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
        detail: 'body must contain tx_hash and signal_hash (64-hex each)',
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
    const { tx_hash, signal_hash, miner_id } = parsed.data;

    // 1. Observe the facts ourselves through the two-provider gateway (REV-009).
    const lookup = await service.lookup({ chain: 'base', tx_hash });
    const effects = lookup.effects as TransferEffect[];

    // 2. Resolve the signal against the Telegraph Engine API (BR-007).
    const signal = await signalClient.fetchSignal(signal_hash);
    if (!signal) {
      // Unresolvable signal: keep the action locked (FR-018).
      return reply.code(502).send({
        error: 'SIGNAL_UNREACHABLE',
        detail: `signal ${signal_hash} could not be resolved on the Telegraph Engine`,
      });
    }
    if (!signalMatchesTx(signal, tx_hash)) {
      // The signal records a different transaction: refuse (REV-009).
      return reply.code(422).send({
        error: 'SIGNAL_MISMATCH',
        detail: `signal ${signal_hash} records a different transaction than ${tx_hash}`,
      });
    }

    // 3. Cross-check the signal's recorded effects against our own observation.
    const signalEffects = extractSignalEffects(signal);
    if (signalEffects === null || !effectsEqual(signalEffects, effects)) {
      // For a finalized transaction the recorded answer and our observation must
      // agree; disagreement means the signal is not backing this exact result.
      return reply.code(422).send({
        error: 'SIGNAL_MISMATCH',
        detail: `signal ${signal_hash} effect data does not match the independently observed effects`,
      });
    }

    // 4. Map the observed state to a consumer verdict, then transition atomically.
    let verdict: { matched: boolean; outcome: 'RELEASED' | 'REJECTED' | 'LOCKED'; reason: string };
    if (DEFINITIVE_FAILURE_STATES.has(lookup.state)) {
      verdict = {
        matched: false,
        outcome: 'REJECTED',
        reason: `execution failed (${lookup.state}); expected payment did not occur`,
      };
    } else if (RETRYABLE_STATES.has(lookup.state)) {
      verdict = {
        matched: false,
        outcome: 'LOCKED',
        reason: `retryable verification state ${lookup.state}; action remains locked (FR-018)`,
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
        signalHash: signal_hash,
        minerId: miner_id,
        evidence: {
          tx_hash,
          lookup_state: lookup.state,
          effects: lookup.effects,
          signal_hash,
        },
      });
      return reply.code(200).send({
        action: updated,
        verdict: { matched: verdict.matched, outcome: verdict.outcome, reason: verdict.reason },
        refused_duplicate: refusedDuplicate,
      });
    } catch (err) {
      if (err instanceof ConsumerError) {
        return reply.code(409).send({ error: err.code, detail: err.message });
      }
      throw err;
    }
  });
}