import { describe, expect, it } from 'vitest';
import { ConsumerStore, ConsumerError } from '../src/consumerStore.js';
import type { ExpectedEffect } from '../src/comparator.js';

const EXPECTED: ExpectedEffect = {
  chain_id: 8453,
  token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  sender: '0x4506de02071dcd46a22638aab6cd19e57e252e22',
  recipient: '0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59',
  raw_amount: '237440081636',
};

function store() {
  return new ConsumerStore(':memory:');
}

describe('ConsumerStore (FR-015..FR-019, BR-008)', () => {
  it('creates an action in LOCKED with the frozen expectation', () => {
    const s = store();
    const a = s.createAction('act-1', EXPECTED);
    expect(a.status).toBe('LOCKED');
    expect(a.chain_id).toBe(8453);
    expect(a.released_by_signal).toBeNull();
  });

  it('refuses duplicate action ids (FR-015 unique action)', () => {
    const s = store();
    s.createAction('act-1', EXPECTED);
    expect(() => s.createAction('act-1', EXPECTED)).toThrow(ConsumerError);
  });

  it('normalizes addresses to lowercase in the frozen expectation', () => {
    const s = store();
    const a = s.createAction('act-2', { ...EXPECTED, sender: '0x4506dE02071dcd46a22638aAB6cd19E57e252e22' });
    expect(a.sender).toBe(EXPECTED.sender);
  });

  it('releases exactly once on a match; duplicates refused with audit (FR-016/FR-019)', () => {
    const s = store();
    s.createAction('act-3', EXPECTED);
    const first = s.resolveAction('act-3', {
      matched: true,
      outcome: 'RELEASED',
      reason: 'matched',
      signalHash: '0x' + 'aa'.repeat(32),
    });
    expect(first.action.status).toBe('RELEASED');
    expect(first.refusedDuplicate).toBe(false);
    expect(first.action.released_by_signal).toBe('0x' + 'aa'.repeat(32));

    const second = s.resolveAction('act-3', {
      matched: true,
      outcome: 'RELEASED',
      reason: 'attempted re-release',
      signalHash: '0x' + 'bb'.repeat(32),
    });
    expect(second.refusedDuplicate).toBe(true);
    expect(second.action.status).toBe('RELEASED');
    expect(second.action.released_by_signal).toBe('0x' + 'aa'.repeat(32));

    const attempts = s.getAttempts('act-3');
    expect(attempts.length).toBe(2);
    expect(attempts[1]?.state).toBe('RELEASED');
    expect(attempts[1]?.reason).toContain('duplicate attempt refused');
  });

  it('rejects on a semantic mismatch and cannot be flipped later (FR-017/BR-008)', () => {
    const s = store();
    s.createAction('act-4', EXPECTED);
    const r = s.resolveAction('act-4', {
      matched: false,
      outcome: 'REJECTED',
      reason: 'WRONG_RECIPIENT: recipient mismatch',
    });
    expect(r.action.status).toBe('REJECTED');
    expect(r.action.reject_reason).toContain('WRONG_RECIPIENT');

    const flip = s.resolveAction('act-4', {
      matched: true,
      outcome: 'RELEASED',
      reason: 'attempted flip after rejection',
      signalHash: '0x' + 'cc'.repeat(32),
    });
    expect(flip.refusedDuplicate).toBe(true);
    expect(flip.action.status).toBe('REJECTED');
  });

  it('keeps LOCKED on retryable errors and records the attempt (FR-018)', () => {
    const s = store();
    s.createAction('act-5', EXPECTED);
    const r = s.resolveAction('act-5', {
      matched: false,
      outcome: 'LOCKED',
      reason: 'PENDING: waiting for finality',
    });
    expect(r.action.status).toBe('LOCKED');
    expect(s.getAttempts('act-5').length).toBe(1);
  });

  it('requires a signal hash to release (BR-007)', () => {
    const s = store();
    s.createAction('act-6', EXPECTED);
    expect(() =>
      s.resolveAction('act-6', {
        matched: true,
        outcome: 'RELEASED',
        reason: 'matched but no signal',
      }),
    ).toThrow(ConsumerError);
    // Action is still LOCKED and releasable with a signal.
    const r = s.resolveAction('act-6', {
      matched: true,
      outcome: 'RELEASED',
      reason: 'matched with signal',
      signalHash: '0x' + 'dd'.repeat(32),
    });
    expect(r.action.status).toBe('RELEASED');
  });

  it('persists evidence as JSON in the audit trail', () => {
    const s = store();
    s.createAction('act-7', EXPECTED);
    s.resolveAction('act-7', {
      matched: false,
      outcome: 'REJECTED',
      reason: 'NO_EFFECT: approval only',
      evidence: { state: 'OK', effects: [] },
    });
    const attempts = s.getAttempts('act-7');
    expect(JSON.parse(attempts[0]!.evidence_json!)).toEqual({ state: 'OK', effects: [] });
  });
});