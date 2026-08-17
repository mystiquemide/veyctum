# Veyctum Project State

## Project

- Plan file: `PROJECT_PLAN.md`
- Status: Phase 1 in progress - CP-001 read-only evidence complete; paid step awaiting wallet + approval
- Current phase: Phase 1 - Prove Veyctum's semantic effects are a scoreable Telegraph capability
- Current checkpoint: CP-001 (Partial)
- Last updated: 2026-08-17
- Last agent: Executor
- Planning confidence: 82/100 (Medium)

## Source of Truth Order

1. Repository or observable system state
2. Executed verification evidence
3. Approved `PROJECT_PLAN.md`
4. `PROJECT_STATE.md`
5. Unverified notes

The repository proves what exists.

The plan defines intended scope, design, phases, requirements, security controls, and acceptance criteria.

This state file records execution history, current status, decisions, deviations, blockers, evidence, and handoff context.

## Execution Rules

1. Read the plan and state before changing project assets.
2. Inspect the actual repository and external environment before trusting prior state.
3. Follow phase dependencies and acceptance criteria.
4. Update this file after every checkpoint and work session.
5. Do not mark tests or requirements as passed unless they ran successfully and their scope covers the claim.
6. Record deviations, decisions, failed attempts, risks, and blockers.
7. Never erase checkpoint history.
8. End every session with one exact next action.
9. Keep entries factual, concise, and free of hidden reasoning.
10. Change `PROJECT_PLAN.md` only through the amendment protocol.
11. Never skip the Phase 1 scoreability gate or silently replace the approved winning mechanism.
12. Never present fixtures, local results, synthetic traffic, or direct Miner calls as real Telegraph evidence.

## Current Objective

- Phase: Phase 1 - Prove Veyctum's semantic effects are a scoreable Telegraph capability
- Checkpoint: CP-001 (in progress; read-only evidence complete, paid step awaiting wallet + spend approval)
- Goal: Determine with authoritative evidence whether the live canonical `ONCHAIN_TX_LOOKUP` request, answer, ground truth, and scorer reward normalized ERC-20 effects, and freeze the truthful Miner/consumer boundary.
- Expected files or assets: Future Phase 1 evidence may include source code, diagnostic schema, captured request/response artifacts, and checkpoint updates; `evidence/phase1/` now contains the read-only snapshots.
- Acceptance criteria:
  - At least one paid Telegraph response and signal hash are captured. (PENDING - x402 wallet step)
  - The accepted request and response schema are recorded exactly. (PARTIAL - 402 challenge/terms recorded; paid response pending)
  - Effect scoreability is proven or disproven rather than assumed. (IN PROGRESS - see findings)
  - `DEC-001` and `DEC-002` are resolved. (PENDING - decision draft below)
  - A no-go result stops implementation pending an amendment.
- Required verification: Live Telegraph discovery, paid request, signal lookup, released H1 specification/canonical examples, official score behavior, and documented timestamps/outputs.

## Current Status

### Completed

- Planning inputs and approved Veyctum concept reviewed.
- Telegraph judging rules and schedule reviewed.
- Telegraph Miner YAML, registration, Engine/x402, scoring runtime, and protocol-routing documentation reviewed.
- Live `ONCHAIN_TX_LOOKUP` snapshot reviewed on 2026-08-14.
- Official Circle Base and Base Sepolia USDC contract-address source reviewed.
- `PROJECT_PLAN.md` and `PROJECT_STATE.md` created as planning-only artifacts.
- CP-001 read-only evidence collected on 2026-08-17: live intent/miner snapshot, verifier schemas, x402 challenge terms, daemon question history, signal lookup shape, scoring-script registry. Evidence saved under `evidence/phase1/`.

### In Progress

- CP-001 paid request step: one direct ask to Verity (9001) and one auto-routed ask, then signal retrieval. Blocked on user-approved spend cap (DEC-008) and a funded Base Sepolia USDC wallet (BLOCK-003).

### Blocked

- CP-001 paid step is blocked at the x402 wallet boundary: needs user-approved spend cap and a funded Base Sepolia wallet (testnet USDC + gas via official faucets; browser session required).
- Production implementation is intentionally not started until Phase 1 evidence resolves the scoreability question.
- The current Miner thesis cannot proceed beyond Phase 1 until canonical ERC-20 effect scoreability is proven.

### Not Started

- Phase 1 compatibility/scoreability spike
- Repository scaffolding and implementation
- Miner API and RPC integrations
- Telegraph x402 integration
- Consumer action gate and proof console
- Adversarial corpus and benchmark
- Deployment, YAML validation, registration, monitoring, and official scoring
- Track 3 integrations, legitimate request collection, public updates, demo, and submission

## Checkpoint Log

### CP-000: Planning completed

- Status: Complete
- Date: 2026-08-14
- Agent: Planner
- Phase: Planning
- Objective: Produce the project plan and execution state without implementation.
- Work completed:
  - Normalized the approved Veyctum concept and Win Plan.
  - Verified load-bearing Telegraph rules and runtime constraints.
  - Defined the locked winning core, primary actor, operational loop, functional vertical slices, requirements, architecture, security controls, tests, risks, eligibility work, and evidence gates.
  - Converted canonical scoreability into the first release-blocking checkpoint.
- Files or assets changed:
  - `PROJECT_PLAN.md`
  - `PROJECT_STATE.md`
- Commands or checks run:
  - Read the supplied hackathon vertical-slice planning instructions in full.
  - Read the Universal Project Planner skill in full.
  - Queried Telegraph's live Intent and Miner APIs.
  - Read official Telegraph rules and documentation for Miner YAML, registration, Engine requests, x402, scorer constraints, routing, and operations.
  - Reviewed Circle's official USDC contract-address page.
  - Inspected the target repository and confirmed it contained no implementation.
  - Verified the planning artifacts are the only project files, non-empty UTF-8 Markdown, ASCII-clean, structurally complete, and free of whitespace errors.
- Test results:
  - No implementation tests were run because planning mode prohibits implementation.
- Acceptance criteria verified:
  - Required planning sections created.
  - Hackathon work sequenced as functional vertical slices rather than technical layers.
  - Sponsor integration and invariant are inside the planned runtime flow.
  - Positive and negative proof paths are coupled to real product behavior.
  - Requirements have stable identifiers and verification mappings.
  - Security, reliability, eligibility, clean-start, demo, and evidence gates are explicit.
  - No production-code claim is made.
- Decisions:
  - Planning mode is Deep because this is security-sensitive Web3 infrastructure whose score depends on an external protocol.
  - The initial product remains Base plus one official USDC contract and exact transfer semantics.
  - A thin consumer gate is included so the winning invariant affects real state rather than existing only in a lookup response.
- Deviations:
  - None.
- Risks introduced:
  - None; open external uncertainties are recorded rather than hidden.
- Known issues:
  - Canonical scoreability remains unresolved.
  - Budget, providers, deployment, protected action, demand validity, and X account remain open decisions.
- Blockers:
  - Phase 1 may begin only when implementation timing is permitted and x402 diagnostic spending is approved.
- Next exact action: On or after the permitted implementation start, query the live `ONCHAIN_TX_LOOKUP` discovery/OpenAPI and released H1 specification, then execute one paid Telegraph request and capture its signal to resolve `DEC-001` and `DEC-002`.

### CP-001: Scoreability spike - read-only evidence collected (paid step pending)

- Status: Partial
- Date: 2026-08-17
- Agent: Executor
- Phase: Phase 1
- Objective: Snapshot the live ONCHAIN_TX_LOOKUP request/answer/scoring surface and prepare the paid diagnostic calls that resolve DEC-001/DEC-002.
- Work completed:
  - Re-verified Track 1 is open (official start 2026-08-17 12:00 UTC) and the repo is on `main` with only plan/state committed.
  - Snapshot live intents: ONCHAIN_TX_LOOKUP canonical; miner_count 2 (Verity 9001, VulnFeed 10001); both cost_per_call 0.00 and min_price_usdc 10000 ($0.01).
  - Recorded Verity schema: input {chain, tx_hash}; output {chain, chain_id, tx_hash, status, from, to, value_wei, block_number, canonical (label), confidence, summary}. Signal mapping: label=canonical, confidence=confidence, reason=summary. No ERC-20 transfer-effect fields.
  - Recorded VulnFeed schema: input {address}; output security report - off-intent for tx lookup.
  - Confirmed ONCHAIN_TX_LOOKUP is Tier A (deterministic WASM exact match) from official Intents docs.
  - Recorded x402 payment terms: $0.01/call, Base Sepolia USDC 0x036CbD53842c5426634e7929541eC2318f3dCF7e or Solana devnet, payTo 0x5a2324aA18613FAD4e44bDF0d6c73Ec1f6D87ff8, maxTimeoutSeconds 60, settles only on success. Same terms for direct and auto-routed ask.
  - Retrieved signal-lookup shape via GET /engine/v1/signal/{hash} (signal + payload with request/response/timestamp).
  - Paged 2,000 daemon questions: exactly 1 ONCHAIN_TX_LOOKUP row so far (2026-08-15, a misrouted news question answered by VulnFeed with a security report) - evidence the intent currently has no canonical question traffic.
  - Checked scoring-script registry for the intent: all 5 registered candidates (all intents) rejected; no active canonical script exposed on the testnet; champion scorer is internal.
  - Reviewed official scoring-module docs (WASM rank_answer(q, ground_truth, miner_answer) -> 0..1; Tier A exact match) and hackathon rules (75% normalized performance, 25% X, 3-Miner + 100-request guardrails).
- Files or assets changed:
  - `evidence/phase1/` created with 11 read-only snapshots and README summary.
  - `PROJECT_STATE.md` updated with this entry.
- Commands or checks run:
  - `curl GET /engine/v1/intents`, `/engine/v1/intents/ONCHAIN_TX_LOOKUP`, `/engine/v1/intents/ONCHAIN_TX_LOOKUP/miners`
  - `curl GET /api/miners?intent=ONCHAIN_TX_LOOKUP`
  - `curl GET /engine/v1/intents/ONCHAIN_TX_LOOKUP/wasm`
  - `curl POST /engine/v1/ask/9001` and `/engine/v1/ask` (no payment header; both returned the free 402 challenge)
  - `curl GET /engine/v1/signal/0xd80947b6533d5d1c2dca3a9d4873092628e3779136002b073b6132238c0cc8e9`
  - Paged `GET http://13.237.89.59:7044/daemon/api/questions` (2,000 rows)
  - Read official docs: build-a-scoring-module, engine-ask, x402-inference, intents, hackathon rules; cloned Telegraph-api-docs OpenAPI specs.
- Test results:
  - No implementation tests exist yet (no production code in repo). All live probes returned documented results above.
- Acceptance criteria verified:
  - Not yet - paid response + signal hash still required. Read-only evidence is preserved and reproducible from `evidence/phase1/`.
- Decisions:
  - Draft DEC-001 (request shape): the canonical request accepted by the on-intent incumbent is a transaction reference {chain, tx_hash}; no expected-effect fields observed in any accepted schema.
  - Draft DEC-002 (boundary): with no evidence the canonical ground truth includes normalized ERC-20 effects, the truthful default is branch 2 - Miner returns observed normalized facts; comparison vs expectation lives in the consumer. Final resolution pending the paid probe and official confirmation.
  - No-go consequences understood: if paid probe or official scoring evidence shows ERC-20 effects are unrewarded, the approved Miner thesis pauses for an amendment (branch 3).
- Deviations:
  - None from plan. The paid-request step (plan line: "Perform a paid direct request and an auto-routed request") is sequenced after the wallet boundary, as planned.
- Risks introduced:
  - None executed; only read-only public API calls were made.
- Known issues:
  - ISSUE-004 (budget/spend cap) still open; ISSUE-001 (scoreability) partially informed by new evidence but not resolved; ISSUE-002 (question fields) partially informed by Verity/engine schemas.
- Blockers:
  - BLOCK-003: x402 spend cap not approved and test wallet not funded (Base Sepolia USDC + gas via official faucets require a user browser session).
- Next exact action: After user approves the spend cap and funds the test wallet, run the documented paid probe (direct ask to Verity 9001 with a real finalized Base tx, then auto-routed ask), capture both signal hashes, compare results with independent Base RPC truth, and record the accepted schema + scoreability verdict for DEC-001/DEC-002.

## Decisions Made During Execution

No execution decisions exist yet.

| ID | Date | Decision | Reason | Plan impact |
|---|---|---|---|---|
| - | - | - | - | - |

## Plan Deviations

No deviations exist yet.

| ID | Date | Original plan | Change | Reason | Approval status |
|---|---|---|---|---|---|
| - | - | - | - | - | - |

## Verification Evidence

| Checkpoint | Command or check | Result | Evidence |
|---|---|---|---|
| CP-000 | Target repository inspection | Empty repository; no implementation existed at planning start | Local Git state inspected 2026-08-14 |
| CP-000 | `GET /engine/v1/intents` | `ONCHAIN_TX_LOOKUP` canonical; Miner count 2 at snapshot | `https://devnode.telegraphprotocol.com/engine/v1/intents` |
| CP-000 | `GET /engine/v1/intents/ONCHAIN_TX_LOOKUP/miners` | Verity and VulnFeed listed at snapshot | `https://devnode.telegraphprotocol.com/engine/v1/intents/ONCHAIN_TX_LOOKUP/miners` |
| CP-000 | Official judging-rules review | 75% normalized performance, 25% X; 3-Miner and 100-request guardrails; real Miners required | `https://hackathon.telegraphprotocol.com/rules` |
| CP-000 | Official scoring-runtime review | WASM receives question, ground truth, Miner answer; no network/filesystem/shared state | `https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module` |
| CP-000 | Official Miner integration review | Public YAML and registered live API are required | `https://docs.telegraphprotocol.com/docs/miners/yaml-config` and `https://docs.telegraphprotocol.com/docs/miners/miner-registration` |
| CP-000 | Official Engine/x402 review | Paid request returns Miner/result/cost/duration/signal hash; Base Sepolia USDC supported | `https://docs.telegraphprotocol.com/docs/using/engine-ask` and `https://docs.telegraphprotocol.com/docs/using/x402-inference` |
| CP-000 | Circle contract-address review | Official Base and Base Sepolia USDC addresses located | `https://developers.circle.com/stablecoins/usdc-contract-addresses` |
| CP-000 | Planning artifact count | Exactly `PROJECT_PLAN.md` and `PROJECT_STATE.md` exist as project files | `find` audit on 2026-08-14 |
| CP-000 | Encoding and content validation | Both files are non-empty valid UTF-8 and contain no non-ASCII bytes | `test -s`, `iconv`, and byte-pattern audit |
| CP-000 | Required-section validation | Required plan/state headings, handoff protocol, CP-000, checkpoint contract, amendment protocol, and next action are present | Exact-heading audit |
| CP-000 | Whitespace validation | No Git whitespace errors detected | `git diff --check` |

## Known Issues

| ID | Severity | Description | Workaround | Required fix |
|---|---|---|---|---|
| ISSUE-001 | Critical | It is not yet proven that canonical `ONCHAIN_TX_LOOKUP` scoring rewards ERC-20 effects. | None; do not continue full implementation on assumption. | Complete Phase 1 and amend/pivot if unscoreable. |
| ISSUE-002 | High | The official question may not contain expected payment fields. | Keep observed effects in Miner and policy in consumer. | Resolve `DEC-002` from live schema. |
| ISSUE-003 | High | Valid real Track 3 request rules are not fully clarified. | Publish a conservative rule and exclude questionable traffic. | Resolve `DEC-006` in official Discord. |
| ISSUE-004 | Medium | Budget and testnet funds are unspecified. | Planning uses no paid operations. | Resolve `DEC-008` before paid requests. |
| ISSUE-005 | Medium | RPC, hosting, durable database, and protected action choices are open. | Plan defines decision criteria. | Resolve `DEC-003-DEC-005` by phase deadlines. |

## Blockers

| ID | Description | Impact | Required resolution |
|---|---|---|---|
| BLOCK-001 | Canonical ERC-20 effect scoreability unknown | Blocks Phases 2-9 under the current approved thesis | Complete Phase 1 with authoritative evidence |
| BLOCK-002 | Implementation start permission/timing not revalidated | Could violate hackathon build rules | Confirm official rules/Discord before code |
| BLOCK-003 | x402 and registration spend cap/funding unavailable or unapproved | Blocks paid sponsor proof and registration | User approves cap and funds test wallet |

## Checkpoint and Amendment Contract

The future executor must update this file after:

- Setup
- Every functional vertical slice or phase
- Schema or migration changes
- Major architecture decisions
- External integrations
- Security-sensitive changes
- Failed attempts
- Review completion
- Test runs
- Blockers
- Deployment preparation
- Every work session

Use this exact checkpoint shape:

### CP-[number]: [Name]

- Status: Complete | Partial | Blocked | Failed
- Date:
- Agent:
- Phase:
- Objective:
- Work completed:
- Files or assets changed:
- Commands or checks run:
- Test results:
- Acceptance criteria verified:
- Decisions:
- Deviations:
- Risks introduced:
- Known issues:
- Blockers:
- Next exact action:

Do not store hidden reasoning, casual narration, every command, token usage, or unverified claims.

### Plan amendment protocol

After execution begins, `PROJECT_PLAN.md` may change only when new evidence alters approved scope, architecture, requirements, security controls, phase order, or acceptance criteria.

An amendment must:

1. Receive an `AMD-[number]` identifier.
2. State the original plan.
3. State the proposed change.
4. Explain the evidence and reason.
5. Identify requirements, phases, tests, cost, and risks affected.
6. Record approval status.
7. Update the plan only after approval when approval is required.
8. Add the amendment to this file.
9. Preserve historical checkpoint entries.

Minor implementation details that do not change the approved contract belong only in this state file.

## Next Exact Action

User approves the x402 diagnostic spend cap (recommended: 10 Base-Sepolia-USDC calls, $0.01 each, testnet only) and funds a throwaway Base Sepolia test wallet (official Circle USDC faucet + Base Sepolia gas faucet, browser session). Then run the documented paid probe: direct ask to Verity (9001, GET /lookup, {chain: base, tx_hash: <real finalized tx>}) and one auto-routed ask with a tx-reference query; capture both signal hashes via GET /engine/v1/signal/{hash}; compare with independent Base RPC truth; record the accepted schema and the scoreability verdict to resolve DEC-001/DEC-002.
