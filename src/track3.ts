import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname } from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { AppConfig } from './config.js';
import { TRACK3_APP_PAGE } from './appPage.js';
import { TRACK3_LANDING_PAGE } from './landingPage.js';

export const TRACK3_START_AT = '2026-08-31T00:00:00.000Z';
export const TRACK3_END_AT = '2026-09-07T23:59:59.999Z';

export type Track3WindowState = {
  open: boolean;
  reason: 'disabled' | 'before_window' | 'after_window' | 'exclusion_unconfigured' | 'open';
  start: string;
  end: string;
};

export function getTrack3WindowState(
  now: Date,
  start = TRACK3_START_AT,
  end = TRACK3_END_AT,
): Track3WindowState {
  const timestamp = now.getTime();
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (timestamp < startMs) return { open: false, reason: 'before_window', start, end };
  if (timestamp > endMs) return { open: false, reason: 'after_window', start, end };
  return { open: true, reason: 'open', start, end };
}

export function sessionDigest(salt: string, sessionToken: string): string {
  return `sha256:${createHash('sha256').update(`${salt}:${sessionToken}`).digest('hex').slice(0, 24)}`;
}

export type Track3LedgerEntry = {
  timestamp: string;
  session_digest: string;
  tx_hash: string;
  signal_hash: string;
  settled: true;
  duration_ms: number;
};

export class Track3Ledger {
  private readonly entries: Track3LedgerEntry[] = [];
  private readonly pending = new Set<string>();
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
    if (path === ':memory:' || !existsSync(path)) return;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as Track3LedgerEntry;
        if (parsed.settled === true && parsed.tx_hash && parsed.signal_hash && parsed.session_digest) {
          this.entries.push(parsed);
        }
      } catch {
        // Ignore a partial final line. The append-only writer never rewrites history.
      }
    }
  }

  count(): number {
    return this.entries.length;
  }

  distinctSessions(): number {
    return new Set(this.entries.map((entry) => entry.session_digest)).size;
  }

  has(session: string, txHash: string): boolean {
    return this.entries.some((entry) => entry.session_digest === session && entry.tx_hash === txHash);
  }

  private key(session: string, txHash: string): string {
    return `${session}:${txHash}`;
  }

  canAccept(session: string, txHash: string, nowMs: number, cooldownSeconds: number): boolean {
    if (this.has(session, txHash)) return false;
    const last = this.entries
      .filter((entry) => entry.session_digest === session)
      .map((entry) => Date.parse(entry.timestamp))
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0];
    return last === undefined || nowMs - last >= cooldownSeconds * 1000;
  }

  reserve(session: string, txHash: string, nowMs: number, cooldownSeconds: number): boolean {
    const key = this.key(session, txHash);
    if (this.pending.has(key) || !this.canAccept(session, txHash, nowMs, cooldownSeconds)) return false;
    this.pending.add(key);
    return true;
  }

  release(session: string, txHash: string): void {
    this.pending.delete(this.key(session, txHash));
  }

  record(entry: Track3LedgerEntry): void {
    this.entries.push(entry);
    if (this.path === ':memory:') return;
    mkdirSync(dirname(this.path), { recursive: true });
    appendFileSync(this.path, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 });
  }

  toJSONL(): string {
    return this.entries.map((entry) => JSON.stringify(entry)).join('\n');
  }
}

function decodeBase64Json(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function paymentPayer(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null;
  const decoded = decodeBase64Json(value);
  const payload = decoded?.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const authorization = (payload as Record<string, unknown>).authorization;
  if (!authorization || typeof authorization !== 'object' || Array.isArray(authorization)) return null;
  const from = (authorization as Record<string, unknown>).from;
  return typeof from === 'string' && /^0x[a-fA-F0-9]{40}$/.test(from) ? from.toLowerCase() : null;
}

function readCookie(request: FastifyRequest, name: string): string | null {
  const cookieHeader = request.headers.cookie ?? '';
  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    // Malformed percent-encoding in a client-controlled cookie must not 500.
    return null;
  }
}

const track3BodySchema = z.object({
  tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'tx_hash must be a 32-byte EVM transaction hash'),
}).strict();

export function registerTrack3Routes(app: FastifyInstance, config: AppConfig): void {
  const ledger = new Track3Ledger(config.TRACK3_LEDGER_PATH);
  const start = config.TRACK3_START_AT;
  const end = config.TRACK3_END_AT;
  const excluded = new Set(config.TRACK3_EXCLUDED_SESSION_DIGESTS.split(',').map((value) => value.trim()).filter(Boolean));
  const excludedPayers = new Set(config.TRACK3_EXCLUDED_PAYER_ADDRESSES.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
  const salt = config.TRACK3_SESSION_SALT || 'veyctum-track3-local';

  function windowState(): Track3WindowState {
    const state = getTrack3WindowState(new Date(), start, end);
    if (!config.TRACK3_ENABLED) return { ...state, open: false, reason: 'disabled' };
    if (state.open && excluded.size === 0 && excludedPayers.size === 0) return { ...state, open: false, reason: 'exclusion_unconfigured' };
    return state;
  }

  function ensureSession(request: FastifyRequest, reply: { header: (name: string, value: string) => unknown }): string {
    const existing = readCookie(request, 'track3_session');
    if (existing) return existing;
    const token = randomBytes(18).toString('base64url');
    reply.header('Set-Cookie', `track3_session=${encodeURIComponent(token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax`);
    return token;
  }

  function sendPage(request: FastifyRequest, reply: FastifyReply, page: string): unknown {
    ensureSession(request, reply);
    return reply.type('text/html; charset=utf-8').send(page);
  }

  // The product lives at / and /app on the app domain. /track3 stays as the
  // legacy overview on other hosts (the Miner domain) so documented URLs keep
  // resolving, and redirects to / only where / is the landing page.
  app.get('/track3', async (request, reply) => {
    const hostname = (request.headers.host ?? '').split(':')[0]?.toLowerCase() ?? '';
    if (hostname === 'proof.midelabs.xyz') {
      return reply.code(301).header('location', '/').send();
    }
    return sendPage(request, reply, TRACK3_LANDING_PAGE);
  });
  app.get('/track3/app', async (_request, reply) => reply.code(301).header('location', '/app').send());
  app.get('/app', async (request, reply) => sendPage(request, reply, TRACK3_APP_PAGE));

  app.get('/track3/status', async () => {
    const state = windowState();
    return {
      application: 'veyctum-proof',
      mode: state.open ? 'live' : config.TRACK3_ENABLED ? 'closed' : 'preparation',
      reason: state.reason,
      window: { start: state.start, end: state.end, timezone: 'UTC' },
      miner_id: 9005,
      intent: 'ONCHAIN_TX_LOOKUP',
      operator_exclusion_configured: excluded.size > 0 || excludedPayers.size > 0,
      operator_payer_exclusion_configured: excludedPayers.size > 0,
      valid_requests: ledger.count(),
      distinct_sessions: ledger.distinctSessions(),
      ledger: '/track3/ledger.jsonl',
    };
  });

  app.get('/track3/ledger.jsonl', async (_request, reply) => {
    return reply.type('application/x-ndjson; charset=utf-8').send(ledger.toJSONL());
  });

  app.post('/track3/engine', async (request, reply) => {
    const state = windowState();
    if (!state.open) {
      return reply.code(503).send({ error: 'TRACK3_NOT_OPEN', detail: `Track 3 application is unavailable: ${state.reason}`, window: { start, end } });
    }
    const parsed = track3BodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_INPUT', detail: parsed.error.issues[0]?.message ?? 'invalid request' });

    const token = ensureSession(request, reply);
    const digest = sessionDigest(salt, token);
    if (excluded.has(digest)) return reply.code(403).send({ error: 'EXCLUDED_SESSION', detail: 'operator session is excluded from Track 3 reporting' });
    const payer = paymentPayer(request.headers['payment-signature']);
    if (payer && excludedPayers.has(payer)) return reply.code(403).send({ error: 'EXCLUDED_PAYER', detail: 'operator payer is excluded from Track 3 reporting' });
    if (ledger.has(digest, parsed.data.tx_hash)) return reply.code(409).send({ error: 'TRACK3_DUPLICATE', detail: 'this session has already completed this transaction verification' });
    if (!ledger.reserve(digest, parsed.data.tx_hash, Date.now(), config.TRACK3_COOLDOWN_SEC)) {
      return reply.code(429).send({ error: 'TRACK3_COOLDOWN', detail: 'one session must wait before another verification', retry_after_seconds: config.TRACK3_COOLDOWN_SEC });
    }

    const started = Date.now();
    try {
      const paymentSignature = request.headers['payment-signature'];
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (typeof paymentSignature === 'string') headers['payment-signature'] = paymentSignature;
      let upstream: Response;
      try {
        upstream = await fetch(config.TRACK3_ENGINE_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({ method: 'GET', endpoint: '/lookup', payload: { chain: 'base', format: 'full', tx_hash: parsed.data.tx_hash } }),
          signal: AbortSignal.timeout(12_000),
        });
      } catch {
        return reply.code(502).send({ error: 'TRACK3_ENGINE_UNAVAILABLE', detail: 'Telegraph Engine could not be reached' });
      }

      const paymentRequired = upstream.headers.get('payment-required');
      const paymentResponse = upstream.headers.get('payment-response');
      if (paymentRequired) reply.header('PAYMENT-REQUIRED', paymentRequired);
      if (paymentResponse) reply.header('PAYMENT-RESPONSE', paymentResponse);
      reply.header('X-Track3-Request-Count', String(ledger.count()));
      let bodyText: string;
      try {
        bodyText = await upstream.text();
      } catch {
        return reply.code(502).send({ error: 'TRACK3_ENGINE_UNAVAILABLE', detail: 'Telegraph Engine response could not be read' });
      }

      if (upstream.status === 200 && paymentResponse) {
        let responseBody: Record<string, unknown> | null = null;
        try { responseBody = JSON.parse(bodyText) as Record<string, unknown>; } catch { responseBody = null; }
        const settlement = decodeBase64Json(paymentResponse);
        const signalHash = typeof responseBody?.signal_hash === 'string' ? responseBody.signal_hash : null;
        if (settlement?.success === true && settlement.network === 'eip155:84532' && typeof settlement.transaction === 'string' && signalHash) {
          ledger.record({ timestamp: new Date().toISOString(), session_digest: digest, tx_hash: parsed.data.tx_hash, signal_hash: signalHash, settled: true, duration_ms: Date.now() - started });
          reply.header('X-Track3-Counted', 'true');
          reply.header('X-Track3-Request-Count', String(ledger.count()));
        }
      }

      const contentType = upstream.headers.get('content-type');
      if (contentType) reply.header('content-type', contentType);
      return reply.code(upstream.status).send(bodyText);
    } finally {
      ledger.release(digest, parsed.data.tx_hash);
    }
  });
}
