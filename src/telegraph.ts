import type { TransferEffect } from './domain.js';

/**
 * Telegraph signal client + verification helpers (REV-009 / BR-007).
 * A release must be backed by a real Engine signal whose recorded payload
 * matches the transaction and effect data the consumer verified itself.
 */

export interface SignalPayloadResponse {
  tx_hash?: unknown;
  chain_id?: unknown;
  effects?: unknown;
  state?: unknown;
  [key: string]: unknown;
}

export interface TelegraphSignal {
  signal_hash?: unknown;
  signal?: {
    signal_hash?: unknown;
    miner_slug?: unknown;
    subnet_id?: unknown;
    [key: string]: unknown;
  };
  payload?: {
    response?: SignalPayloadResponse;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SignalFetcher {
  fetchSignal(signalHash: string): Promise<TelegraphSignal | null>;
}

export class TelegraphSignalClient implements SignalFetcher {
  constructor(
    private readonly apiUrl: string,
    private readonly timeoutMs = 5000,
  ) {}

  /**
   * Fetch a signal record from the Telegraph Engine API.
   * Returns null on network failure / timeout / non-200 (unresolvable).
   */
  async fetchSignal(signalHash: string): Promise<TelegraphSignal | null> {
    const url = `${this.apiUrl.replace(/\/+$/, '')}/${signalHash}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
      if (!res.ok) return null;
      const body = (await res.json()) as unknown;
      return typeof body === 'object' && body !== null ? (body as TelegraphSignal) : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** The recorded transaction hash inside a signal's payload.response. */
export function extractSignalTxHash(signal: TelegraphSignal): string | null {
  const raw = signal?.payload?.response?.tx_hash;
  return typeof raw === 'string' ? raw.toLowerCase() : null;
}

/** The fetched record must identify the same signal requested by the caller. */
export function signalMatchesHash(signal: TelegraphSignal, signalHash: string): boolean {
  const raw = signal.signal_hash;
  return typeof raw === 'string' && raw.toLowerCase() === signalHash.toLowerCase();
}

/** The recorded effects inside a signal's payload.response (Veyctum answers). */
export function extractSignalEffects(signal: TelegraphSignal): TransferEffect[] | null {
  const raw = signal?.payload?.response?.effects;
  if (!Array.isArray(raw)) return null;
  const out: TransferEffect[] = [];
  for (const e of raw) {
    if (typeof e !== 'object' || e === null) return null;
    const rec = e as Record<string, unknown>;
    if (
      typeof rec.token !== 'string' ||
      typeof rec.sender !== 'string' ||
      typeof rec.recipient !== 'string' ||
      typeof rec.raw_amount !== 'string'
    ) {
      return null;
    }
    out.push({
      token: rec.token,
      sender: rec.sender,
      recipient: rec.recipient,
      raw_amount: rec.raw_amount,
      log_index: typeof rec.log_index === 'number' ? rec.log_index : 0,
      block_hash: typeof rec.block_hash === 'string' ? rec.block_hash : null,
      tx_hash: typeof rec.tx_hash === 'string' ? rec.tx_hash : '',
    });
  }
  return out;
}

/** Canonical comparison key for one effect (case-insensitive, exact amount). */
const effectKey = (e: TransferEffect): string =>
  `${e.token.toLowerCase()}|${e.sender.toLowerCase()}|${e.recipient.toLowerCase()}|${e.raw_amount}|${e.log_index}|${e.block_hash?.toLowerCase() ?? ''}|${e.tx_hash.toLowerCase()}`;

/** Exact, order-sensitive equality of two effect arrays (same finalized tx). */
export function effectsEqual(a: TransferEffect[], b: TransferEffect[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((e, i) => effectKey(e) === effectKey(b[i]!));
}

/** True when the signal's recorded response matches the tx being verified. */
export function signalMatchesTx(signal: TelegraphSignal, txHash: string): boolean {
  return extractSignalTxHash(signal) === txHash.toLowerCase();
}
