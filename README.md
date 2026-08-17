# Veyctum

Telegraph `ONCHAIN_TX_LOOKUP` Miner for Base ERC-20 transactions.

> Transaction succeeded. Payment did not.
> No expected state change, no success.

Veyctum reports the **actual observed transfer effects** of a referenced Base
transaction instead of treating `receipt.status == 1` as proof that the payment
an autonomous consumer expected actually occurred.

## Scope (approved plan, Phase 1 verified 2026-08-17)

- Intent: `ONCHAIN_TX_LOOKUP`, Tier A deterministic (WASM exact-match scoring).
- Chain: Base mainnet (fixed, chain id 8453). One official USDC contract
  allowlisted by address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.
- Boundary (DEC-002, branch 2): the Miner returns observed normalized facts
  plus evidence; the consumer owns expectation comparison and the
  protected-action gate.
- Proof of sponsor integration: `evidence/phase1/` records the live paid
  direct and auto-routed Engine probes with their signal hashes and on-chain
  Base Sepolia settlements.

## Quick start

```bash
cp .env.example .env        # defaults target public Base mainnet RPCs
npm install
npm run dev                 # tsx watch
# or
npm run build && npm start  # tsc build -> dist
```

Endpoints:

- `GET /health` - process liveness (never rate-limited)
- `GET /ready`  - live dependency readiness (probes RPC chain id + head, FR-025)
- `GET /lookup?tx_hash=0x...&chain=base` - transaction effect lookup
- `POST /consumer/actions` - create a protected action in `LOCKED` with a frozen expected effect
- `GET /consumer/actions` - list actions
- `GET /consumer/actions/:id` - action + audit attempts
- `POST /consumer/actions/:id/verify` - drive the gate from a real lookup result

Example:

```bash
curl 'http://localhost:8080/lookup?tx_hash=0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7'
```

Response: `{ schema_version, chain_id, tx_hash, state, status, finality,
effects[], evidence }`.

States (FR-010): `OK`, `NOT_FOUND`, `REVERTED`, `PENDING`,
`NO_SUPPORTED_TRANSFER`, `AMBIGUOUS`, `RPC_DISAGREEMENT`, `UNSUPPORTED`,
`INVALID_INPUT`, `UPSTREAM_ERROR`.

## Consumer proof gate (FR-015..FR-020, DEC-002 branch 2)

The consumer owns expectation comparison and the protected-action gate. A
protected action is created `LOCKED` with a frozen expected effect (chain id
8453, allowlisted USDC address, semantic sender, recipient, exact raw integer
amount). Verification is driven by a real Veyctum `/lookup` result (two
independent Base RPCs must agree) plus, to release, a Telegraph `signal_hash`
(BR-007). The state machine transitions atomically in SQLite:

```text
LOCKED --matching finalized effect + signal--> RELEASED (once)
LOCKED --definitive semantic mismatch--------> REJECTED (never flips)
LOCKED --pending/disagreement/not_found------> LOCKED (retryable)
```

Negative enforcement (the winning invariant): a transaction whose receipt
succeeded (`state: OK`) but whose transfer effect does not match the frozen
expectation (wrong recipient, wrong amount, approval-only `NO_SUPPORTED_TRANSFER`,
zero/self/mint/burn transfers, ambiguous candidates) transitions to `REJECTED`
and the protected action never releases. Duplicate release attempts are refused
and every attempt is retained in the audit trail.

```bash
# create a protected action
curl -X POST localhost:8080/consumer/actions -H 'content-type: application/json' -d '{
  "action_id": "demo-1",
  "expected": {"chain_id":8453,"token":"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
               "sender":"0x2192bc3b4028acc1113f2cd9ac2cba70c36520db",
               "recipient":"0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
               "raw_amount":"237440081636"}
}'

# verify against the real loop: the server fetches the tx facts itself through
# two independent Base RPCs, resolves the signal on the Telegraph Engine API,
# cross-checks that the signal's recorded payload matches the observed effects,
# and only then compares against the frozen expectation (REV-009).
curl -X POST localhost:8080/consumer/actions/demo-1/verify -H 'content-type: application/json' -d '{
  "tx_hash": "0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7",
  "signal_hash": "0x...64hex...", "miner_id": "veyctum"
}'
```

## Checks

```bash
npm run typecheck    # strict TS, 0 errors
npm test             # hermetic unit tests (no network)
npm run test:integration  # live Base RPC integration tests
npm run build        # tsc -> dist
```

## Hackathon (Telegraph Season I, Hackathon 1) — how Track 1 is judged

- The Miner track has **no demo-video submission portal**. The LIVE MINER IS the
  submission: Telegraph validators continuously score our answers against the
  canonical ground truth and rank us on the intent leaderboard.
- Score = 100 points: **75% Normalized Performance** (our average canonical score
  divided by the best miner's in ONCHAIN_TX_LOOKUP — the best miner in each
  intent automatically gets full marks) and **25% Engagement & Transparency on X**
  (evidence-led public updates tagging `@Telegraphprotoc`).
- Cash eligibility guardrail for the intent: **at least 3 active miners** in
  ONCHAIN_TX_LOOKUP (met: Verity 9001, VulnFeed 10001, Veyctum 9005, plus
  DegenLens) **and at least 100 real requests from Track 3 applications**
  (Aug 31–Sep 7). Self-run probes do not count toward this — it is Track 3 app
  demand. Winners announced Sep 19–25.
- Required by the rules: join the official Hackathon Discord; keep the Miner live
  through the whole Track 3 window; never use mocked data; no metric gaming.
- The demo video and this README are credibility/transparency artifacts for judges
  and the X audience (the 25%), and for the Track 3 application — not a scored
  upload.

## Security notes

- Unknown request fields are rejected at the boundary.
- Two independent RPC providers must agree on critical facts, including the
  chain ID they each serve (FR-005/REV-001); a single provider or a
  disagreement never produces a definitive verdict.
- Token identity is the allowlisted contract address, never ticker metadata.
- Rate limiting is enforced in code at 4 requests/second per IP (window 1s,
  429 + Retry-After; health/ready exempt) matching the declared public YAML
  (NFR-005/REV-002). In-memory limiter: single-process deployments only.
- Logs redact authorization and payment headers.
- `GET /ready` performs a live RPC probe (chain id + head) so orchestrators
  cannot false-ready (FR-025/REV-003); `/health` is pure process liveness.
- Never commit `.env`; the Phase 1 test wallet key lives outside the repo.
- SQLite DB lives under `data/` (gitignored); release requires a signal hash.

## x402 paid Engine probe (CP-001 evidence)

`scripts/probe/x402_probe.py` is the reproducible Python client used to run the
paid direct and auto-routed probes. See `evidence/phase1/README.md`.

## Status & Roadmap (2026-08-17)

### Live now

- Miner **registered on-chain** (Base Sepolia, registrationId 104, id 9005), ACTIVE, at
  https://veyctum.splitpot.xyz — a stable HTTPS URL via this VPS (Caddy, Let's Encrypt);
  YAML hosted + SHA-256 pinned (`evidence/registration/README.md`).
- **Positive loop proven**: paid Engine ask `/engine/v1/ask/9005` for a real Base
  USDC transfer returned the normalized effect; consumer gate released the protected
  action once, verified against the real Telegraph signal (`evidence/phase3/README.md`).
- **Negative loop proven**: a real successful-but-approval-only Base tx
  (`0x5c8ea6c0...`) left an action expecting the $237,440.08 payment REJECTED —
  "Transaction succeeded. Payment did not." — with a signal-backed reason and no way
  to flip it (`evidence/phase4/README.md`).
- Registration + both loops carried actual x402 payment settlements on Base Sepolia
  (spend ledger $0.05 / $0.10 Phase 1 cap).

### Next steps

1. **X engagement thread** (25% of score): evidence-led updates tagging
   `@Telegraphprotoc` — registration tx, signal hashes, settlements, the two-loop demo.
2. **Join the official Hackathon Discord** (required by the rules).
3. **Diagnostic scoring module** at integrate.telegraphprotocol.com to observe how the
   canonical ground truth scores our answers (ISSUE-001: scorer not yet active on testnet).
4. **Adversarial corpus + receipt-only baseline benchmark** (FR-023/FR-024) with
   committed raw results.
5. **<180s uncut demo video** of the real positive + negative flow (for judges / the 25%).
6. **Track 3 demand** (Aug 31–Sep 7): publish request-validity rules (BR-009) and drive
   >= 100 real requests from Track 3 applications for the cash-eligibility guardrail.

Keep the miner live and healthy through the whole Track 3 window (NFR-004).