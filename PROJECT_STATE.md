# Veyctum Project State

## Project

- Plan file: `PROJECT_PLAN.md`
- Status: Planned
- Current phase: Not started
- Current checkpoint: CP-000
- Last updated: 2026-08-14
- Last agent: Planner
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
- Checkpoint: CP-001 (not started)
- Goal: Determine with authoritative evidence whether the live canonical `ONCHAIN_TX_LOOKUP` request, answer, ground truth, and scorer reward normalized ERC-20 effects, and freeze the truthful Miner/consumer boundary.
- Expected files or assets: Future Phase 1 evidence may include source code, diagnostic schema, captured request/response artifacts, and checkpoint updates; none exists yet.
- Acceptance criteria:
  - At least one paid Telegraph response and signal hash are captured.
  - The accepted request and response schema are recorded exactly.
  - Effect scoreability is proven or disproven rather than assumed.
  - `DEC-001` and `DEC-002` are resolved.
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

### In Progress

- None. Planning is complete; execution has not begun.

### Blocked

- Production implementation is intentionally not started in planning mode.
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

On or after the permitted implementation start, query the live `ONCHAIN_TX_LOOKUP` Miner schemas and released H1 specification, execute one paid Telegraph request, retrieve its signal, and record whether normalized ERC-20 effect fields affect official scoring so `DEC-001` and `DEC-002` can be resolved before full implementation.
