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

# verify against a real lookup result (signal_hash required to release)
curl -X POST localhost:8080/consumer/actions/demo-1/verify -H 'content-type: application/json' -d '{
  "lookup_result": {"state":"OK","effects":[{...}]},
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