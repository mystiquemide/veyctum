import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname } from 'node:path';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { AppConfig } from './config.js';

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

function readCookie(request: FastifyRequest, name: string): string | null {
  const cookieHeader = request.headers.cookie ?? '';
  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

const track3BodySchema = z.object({
  tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'tx_hash must be a 32-byte EVM transaction hash'),
});

const TRACK3_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Escrow Verifier | Veyctum</title>
<style>
:root{color-scheme:dark;--bg:#090a0c;--panel:#111416;--line:#2a2d2d;--fg:#f4f0e8;--muted:#a6aaa7;--green:#91e6a1;--red:#ff7777;--amber:#ffd166;--cyan:#8fd9ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,Arial,sans-serif}main{max-width:1120px;margin:0 auto;padding:68px 28px 80px}.top{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid var(--line);padding-bottom:22px}.eyebrow{color:var(--green);font:600 14px/1.2 monospace;letter-spacing:.12em;text-transform:uppercase}.badge{border:1px solid var(--amber);color:var(--amber);padding:7px 10px;font:600 12px/1 monospace;letter-spacing:.08em}.hero{padding:64px 0 42px}.hero h1{font-size:clamp(46px,7vw,92px);line-height:.95;letter-spacing:-.07em;max-width:860px;margin:0}.hero h1 span{color:var(--green)}.hero p{color:var(--muted);font-size:21px;line-height:1.45;max-width:700px;margin:26px 0 0}.panel{background:var(--panel);border:2px solid var(--line);padding:28px;margin-top:24px}.label{display:block;color:var(--muted);font:600 13px/1.2 monospace;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px}input{width:100%;background:#0b0e0f;border:2px solid #454b48;color:var(--fg);padding:17px 18px;font:500 18px monospace}input:focus{outline:3px solid var(--green);outline-offset:2px}.actions{display:flex;gap:14px;align-items:center;margin-top:18px;flex-wrap:wrap}button{border:2px solid var(--green);background:var(--green);color:#0a0d0b;padding:14px 20px;font:700 15px monospace;cursor:pointer}button.secondary{background:transparent;color:var(--fg);border-color:var(--line)}button:disabled{cursor:not-allowed;opacity:.5}.status{color:var(--muted);font:500 15px/1.4 monospace}.result{display:none;margin-top:24px}.result.show{display:block}.result-head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--line);padding-bottom:18px}.result-state{font:700 20px monospace}.ok{color:var(--green)}.bad{color:var(--red)}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.detail{border:1px solid var(--line);padding:16px}.detail b{display:block;color:var(--muted);font:600 12px monospace;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}.detail code{font:500 15px/1.4 monospace;overflow-wrap:anywhere}.foot{display:flex;justify-content:space-between;gap:20px;margin-top:30px;color:var(--muted);font:500 13px/1.5 monospace;flex-wrap:wrap}.foot a{color:var(--cyan)}.notice{color:var(--amber);border-left:3px solid var(--amber);padding-left:14px;margin-top:18px;font:500 14px/1.5 monospace}@media(max-width:700px){main{padding:32px 18px 50px}.hero{padding-top:44px}.details{grid-template-columns:1fr}.hero p{font-size:18px}.top{align-items:flex-start}}
</style>
</head>
<body><main>
<header class="top"><div class="eyebrow">Veyctum / Escrow Verifier</div><div class="badge" id="mode">PREPARATION MODE</div></header>
<section class="hero"><h1>The receipt can be true.<br><span>The payment can still be false.</span></h1><p>Verify the effect before a protected action proceeds. This application asks Telegraph Miner 9005 for a full transaction lookup and keeps the result inspectable.</p></section>
<section class="panel"><label class="label" for="tx">Base transaction hash</label><input id="tx" autocomplete="off" spellcheck="false" placeholder="0x followed by 64 hexadecimal characters"><div class="actions"><button id="connect">Connect wallet</button><button id="verify" disabled>Verify via Telegraph</button><span class="status" id="status">No request is sent before you click verify.</span></div><div class="notice" id="notice">Track 3 opens 2026-08-31 UTC. Preparation mode does not send Engine requests.</div><div class="result" id="result"><div class="result-head"><span class="label" style="margin:0">Telegraph result</span><span class="result-state" id="state"></span></div><div class="details"><div class="detail"><b>Chain</b><code id="chain"></code></div><div class="detail"><b>Method</b><code id="method"></code></div><div class="detail"><b>Payment effect</b><code id="effect"></code></div><div class="detail"><b>Signal</b><code id="signal"></code></div></div></div></section>
<footer class="foot"><span>Miner 9005 · ONCHAIN_TX_LOOKUP</span><span><a href="https://veyctum.splitpot.xyz" target="_blank" rel="noreferrer">Live Miner</a> · <a href="https://github.com/mystiquemide/veyctum/blob/main/evidence/track3/RULES.md" target="_blank" rel="noreferrer">Rules</a></span></footer>
</main><script>
const ENGINE='/track3/engine'; const $=id=>document.getElementById(id); let account=null;
function b64json(value){if(!value)return null;try{const s=value.replaceAll('-','+').replaceAll('_','/');return JSON.parse(atob(s+'='.repeat((4-s.length%4)%4)))}catch{return null}}
function utf8b64(value){return btoa(unescape(encodeURIComponent(value)))}
function short(value){return value?value.slice(0,10)+'...'+value.slice(-8):'not returned'}
async function connect(){if(!window.ethereum){$('status').textContent='No browser wallet detected. Use an EVM wallet on Base Sepolia.';return}try{const accounts=await window.ethereum.request({method:'eth_requestAccounts'});account=accounts[0];$('connect').textContent='Wallet '+short(account);$('verify').disabled=false;$('status').textContent='Wallet connected. Verify only when Track 3 is open.'}catch(error){$('status').textContent='Wallet connection was cancelled.'}}
async function verify(){const tx=$('tx').value.trim();if(!/^0x[0-9a-fA-F]{64}$/.test(tx)){ $('status').textContent='Enter a valid 32-byte EVM transaction hash.';return }if(!window.ethereum||!account){await connect();if(!account)return}$('verify').disabled=true;$('status').textContent='Requesting Telegraph payment terms...';try{const body={method:'GET',endpoint:'/lookup',payload:{chain:'base',format:'full',tx_hash:tx}};const first=await fetch(ENGINE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tx_hash:tx})});if(first.status!==402)throw new Error((await first.text()).slice(0,240)||'Track 3 application is not open');const challenge=b64json(first.headers.get('payment-required'));const requirement=challenge?.accepts?.find(x=>x.network==='eip155:84532');if(!requirement)throw new Error('No Base Sepolia payment option was returned');const now=Math.floor(Date.now()/1000);const authorization={from:account,to:requirement.payTo,value:requirement.amount,validAfter:String(now-5),validBefore:String(now+(requirement.maxTimeoutSeconds||60)),nonce:'0x'+[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('')};$('status').textContent='Sign the one-call USDC authorization in your wallet...';const typed={types:{EIP712Domain:[{name:'name',type:'string'},{name:'version',type:'string'},{name:'chainId',type:'uint256'},{name:'verifyingContract',type:'address'}],TransferWithAuthorization:[{name:'from',type:'address'},{name:'to',type:'address'},{name:'value',type:'uint256'},{name:'validAfter',type:'uint256'},{name:'validBefore',type:'uint256'},{name:'nonce',type:'bytes32'}]},primaryType:'TransferWithAuthorization',domain:{name:requirement.extra?.name||'USDC',version:requirement.extra?.version||'2',chainId:84532,verifyingContract:requirement.asset},message:authorization};const signature=await window.ethereum.request({method:'eth_signTypedData_v4',params:[account,JSON.stringify(typed)]});const payment={x402Version:2,resource:challenge.resource,accepted:requirement,payload:{signature,authorization},extensions:{}};const paid=await fetch(ENGINE,{method:'POST',headers:{'content-type':'application/json','payment-signature':utf8b64(JSON.stringify(payment))},body:JSON.stringify(body)});const data=await paid.json();if(!paid.ok)throw new Error(data.detail||data.error||'Telegraph rejected the paid request');const result=data.result||data;$('state').textContent=result.state||result.status||'RETURNED';$('state').className='result-state '+(result.state==='OK'?'ok':result.state==='NO_SUPPORTED_TRANSFER'?'bad':'');$('chain').textContent=(result.chain||'unknown')+' / chain '+(result.chain_id??'unknown');$('method').textContent=result.method?.name||result.method?.selector||'not decoded';$('effect').textContent=result.effects?.length?result.effects.map(x=>short(x.token)+' -> '+short(x.recipient)+' / '+x.raw_amount).join('; '):'No supported transfer effect';$('signal').textContent=short(data.signal_hash||result.signal_hash);$('result').classList.add('show');$('status').textContent='Settled response received from Telegraph.'}catch(error){$('status').textContent=error?.message||'Verification failed';}finally{$('verify').disabled=!account}}
$('connect').addEventListener('click',connect);$('verify').addEventListener('click',verify);fetch('/track3/status').then(r=>r.json()).then(s=>{if(s.mode==='live'){$('mode').textContent='TRACK 3 LIVE';$('notice').textContent='Real application requests are active. One completed verification can produce one settled Engine request.'}else if(s.reason==='after_window'){$('mode').textContent='WINDOW CLOSED';$('notice').textContent='The official Track 3 window has closed.'}}).catch(()=>{});
</script></body></html>`;

export function registerTrack3Routes(app: FastifyInstance, config: AppConfig): void {
  const ledger = new Track3Ledger(config.TRACK3_LEDGER_PATH);
  const start = config.TRACK3_START_AT;
  const end = config.TRACK3_END_AT;
  const excluded = new Set(config.TRACK3_EXCLUDED_SESSION_DIGESTS.split(',').map((value) => value.trim()).filter(Boolean));
  const salt = config.TRACK3_SESSION_SALT || 'veyctum-track3-local';

  function windowState(): Track3WindowState {
    const state = getTrack3WindowState(new Date(), start, end);
    if (!config.TRACK3_ENABLED) return { ...state, open: false, reason: 'disabled' };
    if (state.open && excluded.size === 0) return { ...state, open: false, reason: 'exclusion_unconfigured' };
    return state;
  }

  function ensureSession(request: FastifyRequest, reply: { header: (name: string, value: string) => unknown }): string {
    const existing = readCookie(request, 'track3_session');
    if (existing) return existing;
    const token = randomBytes(18).toString('base64url');
    reply.header('Set-Cookie', `track3_session=${encodeURIComponent(token)}; Path=/track3; Max-Age=604800; HttpOnly; SameSite=Lax`);
    return token;
  }

  app.get('/track3', async (request, reply) => {
    ensureSession(request, reply);
    return reply.type('text/html; charset=utf-8').send(TRACK3_PAGE);
  });

  app.get('/track3/status', async () => {
    const state = windowState();
    return {
      application: 'escrow-verifier',
      mode: state.open ? 'live' : config.TRACK3_ENABLED ? 'closed' : 'preparation',
      reason: state.reason,
      window: { start: state.start, end: state.end, timezone: 'UTC' },
      miner_id: 9005,
      intent: 'ONCHAIN_TX_LOOKUP',
      operator_exclusion_configured: excluded.size > 0,
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
      return reply.code(503).send({ error: 'TRACK3_NOT_OPEN', detail: `Track 3 application is unavailable: ${state.reason}`, window: { start: start, end: end } });
    }
    const parsed = track3BodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_INPUT', detail: parsed.error.issues[0]?.message ?? 'invalid request' });

    const token = ensureSession(request, reply);
    const digest = sessionDigest(salt, token);
    if (excluded.has(digest)) return reply.code(403).send({ error: 'EXCLUDED_SESSION', detail: 'operator session is excluded from Track 3 reporting' });
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
      const bodyText = await upstream.text();

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
