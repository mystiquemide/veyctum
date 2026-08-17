import type { LookupState } from './domain.js';

/** Structured error carrying the public FR-010 state and an HTTP status. */
export class LookupError extends Error {
  readonly code: LookupState;
  readonly httpStatus: number;
  readonly detail: string;

  constructor(code: LookupState, detail: string, httpStatus = 200) {
    super(`${code}: ${detail}`);
    this.name = 'LookupError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.detail = detail;
  }
}

export const stateToStatus = (state: LookupState): 'success' | 'reverted' | 'pending' | 'not_found' | 'error' => {
  switch (state) {
    case 'PENDING':
      return 'pending';
    case 'REVERTED':
      return 'reverted';
    case 'NOT_FOUND':
      return 'not_found';
    case 'OK':
      return 'success';
    default:
      return 'error';
  }
};

/** Map an unexpected internal failure to the public UPSTREAM_ERROR state. */
export function toLookupError(err: unknown): LookupError {
  if (err instanceof LookupError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  return new LookupError('UPSTREAM_ERROR', msg);
}