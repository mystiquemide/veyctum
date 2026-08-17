import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ExpectedEffect } from './comparator.js';

/**
 * Durable protected-action store (FR-015..FR-019, ADR-006).
 * Atomic, at-most-once transitions using SQLite transactions.
 * node:sqlite is built into Node 24 LTS (NFR-002), so no new dependency.
 */

export type ActionStatus = 'LOCKED' | 'VERIFYING' | 'RELEASED' | 'REJECTED';

export interface Action {
  id: string;
  chain_id: number;
  token: string;
  sender: string;
  recipient: string;
  raw_amount: string;
  status: ActionStatus;
  reject_reason: string | null;
  released_by_signal: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attempt {
  id: number;
  action_id: string;
  attempt_at: string;
  state: string;
  reason: string | null;
  signal_hash: string | null;
  miner_id: string | null;
  evidence_json: string | null;
}

export class ConsumerError extends Error {
  readonly code: string;
  constructor(code: string, detail: string) {
    super(`${code}: ${detail}`);
    this.name = 'ConsumerError';
    this.code = code;
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS actions (
  id              TEXT PRIMARY KEY,
  chain_id        INTEGER NOT NULL,
  token           TEXT NOT NULL,
  sender          TEXT NOT NULL,
  recipient       TEXT NOT NULL,
  raw_amount      TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('LOCKED','VERIFYING','RELEASED','REJECTED')),
  reject_reason   TEXT,
  released_by_signal TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  action_id     TEXT NOT NULL REFERENCES actions(id),
  attempt_at    TEXT NOT NULL,
  state         TEXT NOT NULL,
  reason        TEXT,
  signal_hash   TEXT,
  miner_id      TEXT,
  evidence_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_attempts_action ON attempts(action_id);
`;

export class ConsumerStore {
  private readonly db: DatabaseSync;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') {
      mkdirSync(dirname(resolve(dbPath)), { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec(SCHEMA);
  }

  close(): void {
    this.db.close();
  }

  /** Create a protected action in LOCKED with a frozen expectation (FR-015). */
  createAction(
    id: string,
    expected: ExpectedEffect,
    now = new Date().toISOString(),
  ): Action {
    try {
      this.db
        .prepare(
          `INSERT INTO actions (id, chain_id, token, sender, recipient, raw_amount, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'LOCKED', ?, ?)`,
        )
        .run(id, expected.chain_id, expected.token.toLowerCase(), expected.sender.toLowerCase(), expected.recipient.toLowerCase(), expected.raw_amount, now, now);
    } catch (err) {
      // node:sqlite surfaces unique violations as ERR_SQLITE_ERROR; detect the
      // constraint by extended errcode (1555 = SQLITE_CONSTRAINT_PRIMARYKEY).
      const e = err as { code?: string; errcode?: number; message?: string; errstr?: string };
      if (
        e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
        e.errcode === 1555 ||
        e.errstr?.includes('UNIQUE constraint failed')
      ) {
        throw new ConsumerError('ACTION_EXISTS', `action ${id} already exists`);
      }
      throw err;
    }
    const row = this.getAction(id);
    if (!row) throw new ConsumerError('ACTION_NOT_FOUND', `action ${id} missing after create`);
    return row;
  }

  getAction(id: string): Action | null {
    const row = this.db.prepare('SELECT * FROM actions WHERE id = ?').get(id) as
      | (Record<string, unknown> & Action)
      | undefined;
    return row ?? null;
  }

  listActions(limit = 100): Action[] {
    const rows = this.db.prepare('SELECT * FROM actions ORDER BY created_at DESC LIMIT ?').all(limit) as Array<
      Record<string, unknown> & Action
    >;
    return rows;
  }

  getAttempts(actionId: string): Attempt[] {
    const rows = this.db
      .prepare('SELECT * FROM attempts WHERE action_id = ? ORDER BY attempt_at ASC')
      .all(actionId) as Array<Record<string, unknown> & Attempt>;
    return rows;
  }

  /**
   * Single-call verify: LOCKED -> VERIFYING -> RELEASED | REJECTED | back-to-LOCKED,
   * all inside one transaction (FR-016/FR-017 atomicity, FR-019 audit).
   * Duplicate release attempts are refused (BR-008).
   */
  resolveAction(
    id: string,
    input: {
      matched: boolean;
      outcome: 'RELEASED' | 'REJECTED' | 'LOCKED';
      reason: string;
      signalHash?: string | null;
      minerId?: string | null;
      evidence?: unknown;
    },
    now = new Date().toISOString(),
  ): { action: Action; refusedDuplicate: boolean } {
    const action = this.getAction(id);
    if (!action) throw new ConsumerError('ACTION_NOT_FOUND', `action ${id} does not exist`);
    if (action.status !== 'LOCKED') {
      // FR-019 / BR-008: release only once; rejected evidence cannot be flipped.
      // Record the duplicate attempt for the audit trail but refuse the change.
      this.recordAttempt(id, {
        state: action.status,
        reason: `duplicate attempt refused (already ${action.status}): ${input.reason}`,
        signalHash: input.signalHash,
        minerId: input.minerId,
        evidence: input.evidence,
        now,
      });
      return { action, refusedDuplicate: true };
    }

    if (input.outcome === 'RELEASED' && !input.signalHash) {
      // BR-007: only a real Telegraph result may release the protected action.
      throw new ConsumerError(
        'SIGNAL_REQUIRED',
        'release requires a Telegraph signal_hash',
      );
    }

    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (input.outcome === 'RELEASED') {
        this.db
          .prepare(`UPDATE actions SET status='RELEASED', released_by_signal=?, updated_at=? WHERE id=? AND status='LOCKED'`)
          .run(input.signalHash ?? '', now, id);
      } else if (input.outcome === 'REJECTED') {
        this.db
          .prepare(`UPDATE actions SET status='REJECTED', reject_reason=?, updated_at=? WHERE id=? AND status='LOCKED'`)
          .run(input.reason, now, id);
      }
      // else outcome LOCKED: no change (retryable sponsor/verification error, FR-018).
      // REV-010: the audit row is written inside the same transaction so a crash
      // cannot leave a status change without its FR-019 audit entry.
      this.recordAttempt(id, {
        state: input.outcome,
        reason: input.reason,
        signalHash: input.signalHash,
        minerId: input.minerId,
        evidence: input.evidence,
        now,
      });
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }

    const updated = this.getAction(id);
    if (!updated) throw new ConsumerError('ACTION_NOT_FOUND', `action ${id} missing after resolve`);
    return { action: updated, refusedDuplicate: false };
  }

  private recordAttempt(
    actionId: string,
    input: {
      state: string;
      reason: string;
      signalHash?: string | null;
      minerId?: string | null;
      evidence?: unknown;
      now: string;
    },
  ): void {
    this.db
      .prepare(
        `INSERT INTO attempts (action_id, attempt_at, state, reason, signal_hash, miner_id, evidence_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        actionId,
        input.now,
        input.state,
        input.reason,
        input.signalHash ?? null,
        input.minerId ?? null,
        input.evidence === undefined ? null : JSON.stringify(input.evidence),
      );
  }
}