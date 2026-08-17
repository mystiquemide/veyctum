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

- `GET /health` - process liveness
- `GET /ready`  - dependency readiness
- `GET /lookup?tx_hash=0x...&chain=base` - transaction effect lookup

Example:

```bash
curl 'http://localhost:8080/lookup?tx_hash=0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7'
```

Response: `{ schema_version, chain_id, tx_hash, state, status, finality,
effects[], evidence }`.

States (FR-010): `OK`, `NOT_FOUND`, `REVERTED`, `PENDING`,
`NO_SUPPORTED_TRANSFER`, `AMBIGUOUS`, `RPC_DISAGREEMENT`, `UNSUPPORTED`,
`INVALID_INPUT`, `UPSTREAM_ERROR`.

## Checks

```bash
npm run typecheck
npm test
```

## Security notes

- Unknown request fields are rejected at the boundary.
- Two independent RPC providers must agree on critical facts (ADR-005).
- Token identity is the allowlisted contract address, never ticker metadata.
- Logs redact authorization and payment headers.
- Never commit `.env`; the Phase 1 test wallet key lives outside the repo.

## x402 paid Engine probe (CP-001 evidence)

`scripts/probe/x402_probe.py` is the reproducible Python client used to run the
paid direct and auto-routed probes. See `evidence/phase1/README.md`.