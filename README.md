# Veyctum

[![CI](https://github.com/mystiquemide/veyctum/actions/workflows/ci.yml/badge.svg)](https://github.com/mystiquemide/veyctum/actions/workflows/ci.yml)

**A Telegraph `ONCHAIN_TX_LOOKUP` Miner that verifies what a Base ERC-20 transaction actually did, not merely whether it executed successfully.**

> **Transaction succeeded. Payment did not.**
>
> A successful EVM receipt is not proof that the expected payment happened.

Veyctum turns a Base transaction hash into deterministic, normalized transfer effects with inspectable evidence. Downstream autonomous systems can then act on the observed state change instead of trusting `receipt.status == 1` as a proxy for fulfillment.

**Live Miner:** [veyctum.splitpot.xyz](https://veyctum.splitpot.xyz)  
**Telegraph Miner ID:** `9005`  
**Intent:** `ONCHAIN_TX_LOOKUP`  
**Network observed:** Base mainnet (`8453`)  
**Telegraph registration:** Base Sepolia, registration ID `104`

## Why Veyctum exists

Autonomous systems frequently receive a transaction hash as proof that something happened on-chain. The obvious check is the transaction receipt. But `status == 1` only proves the EVM execution did not revert.

It does **not** prove that:

- the expected token moved,
- the expected sender paid,
- the expected recipient received funds,
- the expected amount was transferred,
- or any payment transfer happened at all.

A successful approval transaction, wrong-recipient transfer, wrong-amount transfer, or unrelated token movement can all look "successful" at the receipt level while failing the action an autonomous system expected.

Veyctum closes that gap by reporting the actual supported transfer effects of the referenced transaction.

## The mechanism

```text
Transaction hash
      |
      v
Two independent Base RPC providers
      |
      | agree on chain + transaction + receipt
      v
Finality + ERC-20 Transfer normalization
      |
      v
Observed effects + evidence
      |
      v
Telegraph signal
      |
      v
Consumer verifies signal against independently observed effects
      |
      +--> expected effect matches  -> RELEASED once
      |
      +--> definitive mismatch      -> REJECTED
      |
      +--> pending/disagreement     -> stays LOCKED
```

The Miner deliberately reports **observed facts**. The consumer owns the expected effect and the protected action. This keeps the intelligence reusable instead of baking one application's business rule into the Miner.

## Real proof, not a mock

The Telegraph Hackathon rules say the goal is evidence that the quality flywheel works in real conditions, not simply a polished demo. Veyctum's core claims are backed by real paid Telegraph requests, real signals, real Base transactions, and real x402 settlement.

| Proof | Result |
|---|---|
| Miner registration | Miner `9005`, registration ID `104`, active on Base Sepolia |
| Stable endpoint | `https://veyctum.splitpot.xyz` |
| Positive paid request | Real Base USDC transfer served by Veyctum in `1663 ms` |
| Positive signal | `0x8b782fecb8b5f92e5e5c4307ede66b2a3b462bfbac6014ca9e289281ffb4ef50` |
| Positive consumer outcome | Protected action changed from `LOCKED` to `RELEASED` exactly once |
| Negative paid request | Successful approval-only Base transaction served in `1236 ms` |
| Negative signal | `0x9ea3e072c53bf1904478b2388ae345991595e848924a580c670a92a9db5a87a0` |
| Negative consumer outcome | `REJECTED` with `NO_EFFECT`; duplicate verification could not flip it |

The positive fixture is a real Base USDC transfer:

`0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7`

The negative fixture is a real successful USDC approval transaction with no transfer effect:

`0x5c8ea6c032bbba661648924da38a8ecf67bafcf92a8cc81ad58af000f7620994`

The complete reproducible artifacts are indexed in [`evidence/`](./evidence/).

## Why this fits Telegraph

Telegraph's Miner track rewards verified intelligence that can be ranked and consumed by downstream applications. Veyctum is designed around that exact loop:

1. **Request** — an application asks for intelligence about a Base transaction.
2. **Infer** — Veyctum resolves and normalizes the transaction's actual transfer effects.
3. **Validate** — Telegraph can evaluate the Miner output against canonical ground truth.
4. **Publish** — the result is preserved as a Telegraph signal.
5. **Act** — a consumer independently verifies the signal before releasing or rejecting a protected action.
6. **Settle** — paid requests use Telegraph's x402 settlement path.

For Hackathon 1, the official Miner score is **75% Normalized Performance within the Intent** and **25% Engagement & Updates on X**. Cash-prize eligibility also requires at least three active Miners in the Intent and at least 100 real requests from Track 3 applications. Veyctum is kept live for that demand window.

Official rules: [hackathon.telegraphprotocol.com/rules](https://hackathon.telegraphprotocol.com/rules)

## API

### `GET /lookup`

```bash
curl 'https://veyctum.splitpot.xyz/lookup?chain=base&tx_hash=0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7'
```

The response contains:

```text
schema_version
chain_id
tx_hash
state
status
finality
effects[]
evidence
error_code
error_detail
```

Key states:

- `OK` — supported finalized transfer effects were found.
- `NO_SUPPORTED_TRANSFER` — execution succeeded but no supported payment transfer was observed.
- `PENDING` — transaction is not yet definitive.
- `REVERTED` — EVM execution reverted.
- `RPC_DISAGREEMENT` — independent providers disagree, so Veyctum fails closed.
- `NOT_FOUND`, `AMBIGUOUS`, `UNSUPPORTED`, `INVALID_INPUT`, `UPSTREAM_ERROR` — explicit non-success states rather than fabricated certainty.

### Health

```text
GET /health
GET /ready
```

`/health` is process liveness. `/ready` performs a live dependency check before reporting readiness.

## Consumer proof gate

The repository includes a small reference consumer showing how autonomous actions can use Veyctum safely.

A protected action starts with a frozen expected effect:

```text
chain ID + token + sender + recipient + exact raw amount
```

Verification accepts a transaction hash and a real Telegraph signal hash. The server then:

1. independently fetches the transaction through Veyctum's two-provider path,
2. resolves the Telegraph signal,
3. verifies the signal's recorded effects equal the independently observed effects,
4. compares those facts with the frozen expectation,
5. performs one atomic state transition.

```text
LOCKED -> RELEASED   only on an exact verified match
LOCKED -> REJECTED   on a definitive semantic mismatch
LOCKED -> LOCKED     when evidence is not yet definitive
```

A caller cannot supply a fabricated lookup result to force a release, and a rejected or released action cannot be flipped by replaying verification.

## Reliability and safety

- Two independent RPC providers must agree on critical transaction facts.
- Both providers are verified to serve Base chain ID `8453`.
- Token identity is the allowlisted contract address, not ticker metadata.
- Only finalized supported transfer effects are treated as definitive.
- Unknown request fields are rejected.
- Public lookup traffic is rate-limited.
- Authorization and payment headers are redacted from logs.
- Consumer state transitions and audit attempts are persisted atomically in SQLite.
- Release requires a Telegraph signal and an independent effect cross-check.
- Secrets are loaded from environment variables and `.env` is ignored.

## Run locally

Requirements: Node.js 24+

```bash
git clone https://github.com/mystiquemide/veyctum.git
cd veyctum
npm ci
cp .env.example .env
npm run build
npm start
```

Development mode:

```bash
npm run dev
```

## Verification

```bash
npm run typecheck
npm test
npm run test:integration
npm run build
```

The hermetic suite does not require network access. Integration tests exercise live Base RPC behavior separately.

## Telegraph registration artifact

[`veyctum.yaml`](./veyctum.yaml) is the public Miner manifest used for registration. Its hosted bytes were hashed before the on-chain registration and are intentionally kept byte-identical to that commitment.

Hosted manifest: [https://veyctum.splitpot.xyz/veyctum.yaml](https://veyctum.splitpot.xyz/veyctum.yaml)

Registration transaction:

[Base Sepolia transaction `0xd94ac235...7a95`](https://sepolia.basescan.org/tx/0xd94ac2357a6c7c1ba439837fb1c57a0b5a959a9f01405602e2d30e87b65c7a95)

## Repository map

```text
src/                 Miner API, RPC agreement, effect normalization, consumer gate
scripts/             Reproducible Telegraph/x402 probe utilities
test/                Hermetic and live integration tests
evidence/            Registration, paid-request, signal, settlement, and end-to-end proof
veyctum.yaml          Telegraph Miner registration manifest
.github/workflows/    CI
```

## Evidence

Start with [`evidence/README.md`](./evidence/README.md) for the shortest judge-oriented path through the proof artifacts.

## License

MIT
