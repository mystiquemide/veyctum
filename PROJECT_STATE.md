# Veyctum Project State

## Project

- Plan file: `PROJECT_PLAN.md`
- Status: Phase 1 COMPLETE; Phase 2 in progress - CP-002A, CP-002B, and CP-002C (hardening + consumer gate) complete; registration checkpoint next
- Current phase: Phase 2 - Complete a thin real routed lookup with inspectable proof
- Current checkpoint: CP-002C (Complete); registration checkpoint (not started)
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

- Phase: Phase 2 - Complete a thin real routed lookup with inspectable proof (next)
- Checkpoint: CP-002 (not started)
- Goal: Establish the smallest real machine-to-machine loop: consumer request -> x402 Telegraph Engine -> Veyctum -> Base RPCs -> normalized result -> signal proof.
- Prerequisites: Phase 1 complete (branch 2). RPC, hosting, wallet, and database decisions still open (DEC-003-DEC-005).
- Next exact action: Scaffold the Veyctum repository (pinned toolchain, CI, env schema, secret scanning), implement the Miner API core (strict validation, parallel RPC lookup with agreement check, finality, Transfer-log normalization for Base USDC), and register a diagnostic scoring module for ONCHAIN_TX_LOOKUP via the integration sandbox to observe the canonical ground-truth corpus.

## Current Status

### Completed

- Planning inputs and approved Veyctum concept reviewed.
- Telegraph judging rules and schedule reviewed.
- Telegraph Miner YAML, registration, Engine/x402, scoring runtime, and protocol-routing documentation reviewed.
- Live `ONCHAIN_TX_LOOKUP` snapshot reviewed on 2026-08-14.
- Official Circle Base and Base Sepolia USDC contract-address source reviewed.
- `PROJECT_PLAN.md` and `PROJECT_STATE.md` created as planning-only artifacts.
- CP-001 read-only evidence collected on 2026-08-17 (evidence/phase1/).
- CP-001 paid probes executed on 2026-08-17: direct ask to Verity and auto-routed ask, both $0.01, signals and settlements captured; DEC-001/DEC-002 resolved on branch 2 (evidence/phase1/paid/).

### In Progress

- None.

### Blocked

- None for Phase 1. Phase 2 depends on open decisions DEC-003-DEC-005 (RPC provider, hosting, durable database) which the plan assigns to Phase 2 deadlines.

### Not Started

- Phase 2 repository scaffolding and Miner implementation
- Miner API and RPC integrations
- Telegraph x402 integration (client exists as scripts/probe/x402_probe.py)
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

### CP-001 completion: paid probes executed, DEC-001/DEC-002 resolved (branch 2)

- Status: Complete
- Date: 2026-08-17
- Agent: Executor
- Phase: Phase 1
- Objective: Execute one direct and one auto-routed paid Telegraph request, preserve signal evidence, record the accepted schema, and choose the decision branch.
- Work completed:
  - User approved the x402 spend cap (10 calls, $0.01/call) and funded a throwaway Base Sepolia wallet (0x65aE39Fd36f2a9Fa8d738A0FaC369c0CDc507a99; key stored 0600 at /root/.veyctum-phase1-wallet.json, outside the repo).
  - Built and verified the reproducible x402 v2 client (`scripts/probe/x402_probe.py`): 402 challenge -> EIP-3009 transferWithAuthorization (EIP-712, domain name "USDC", version "2", chain 84532, verified via sepolia.base.org eth_call) -> PAYMENT-SIGNATURE retry.
  - Direct probe to Verity (9001) GET /lookup for fixture tx: 200, cost $0.01, signal 0xbbe9906e...98cf, settlement tx 0x92fbb45d... on Base Sepolia.
  - Auto-routed probe with a tx-reference query: 200, router classified ONCHAIN_TX_LOOKUP and selected Verity, signal 0xb831d577...83fb, settlement tx 0xa7285d28... on Base Sepolia.
  - Verified settlement receipts (PAYMENT-RESPONSE headers): success=true, payer matches wallet, both settlements on-chain.
  - Confirmed engine preserves the full miner JSON in the signal payload (custom fields verifiable by consumers).
- Files or assets changed:
  - `scripts/probe/x402_probe.py` (documented, reproducible client; no key material in repo)
  - `evidence/phase1/paid/` - 12 artifacts: requests, challenges, payment payloads, responses, signals, settlement metadata for both probes
  - `evidence/phase1/README.md` - paid probe results + fixture ground truth
  - `PROJECT_STATE.md` - this entry
- Commands or checks run:
  - `/tmp/x402venv/bin/python scripts/probe/x402_probe.py --ask /engine/v1/ask/9001 --body '{"method":"GET","endpoint":"/lookup","payload":{"chain":"base","tx_hash":"0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7"}}'`
  - `/tmp/x402venv/bin/python scripts/probe/x402_probe.py --ask /engine/v1/ask --body '{"query":"Look up the status, details and token transfer effects of Base transaction 0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7"}'`
  - Independent ground truth via public Base mainnet RPC (eth_getTransactionByHash / eth_getTransactionReceipt / log decode)
- Test results:
  - Direct probe returned the expected canonical fields: status confirmed_success, block 50101700, from/to/value_wei matching on-chain truth, confidence 1.
  - Auto-routed probe returned the same result, proving direct vs routed semantic equivalence for the same fixture.
  - Both signal lookups (GET /engine/v1/signal/{hash}) returned the recorded payloads.
- Acceptance criteria verified:
  - At least one real paid response + signal hash: PASS (two, hashes above).
  - Accepted request/response schema recorded exactly: PASS (Verity input/output schema + engine envelope + x402 payment terms in evidence/phase1).
  - Scoreability evidence: PASS for boundary decision - intent is Tier A deterministic; accepted request is a transaction reference with no expected-effect fields; signals preserve full miner JSON (custom effect fields are transmitted and recorded); canonical scorer not yet active on testnet (residual verification tracked, not assumed).
  - DEC-002 boundary recorded: PASS (below).
  - No-go not triggered.
- Decisions:
  - DEC-001 RESOLVED: canonical request = transaction reference {chain, tx_hash} per intent description and accepted Verity schema; no expected-effect fields exist in any accepted schema.
  - DEC-002 RESOLVED (branch 2): Miner returns observed normalized facts (status, from, to, value_wei, block, evidence, plus extended normalized ERC-20 transfer effects); the consumer owns expectation comparison and the protected-action gate. Rationale: supported by live probes (effects absent from incumbent schema, full JSON preserved in signals, intent description allows "details, status or effects").
  - DEC-008 RESOLVED for Phase 1: $0.02 of the approved 10-call cap used; wallet retains the remainder.
- Deviations:
  - None.
- Risks introduced:
  - None; all actions were read-only plus two $0.01 testnet payments.
- Known issues:
  - ISSUE-001 updated: scoreability of ERC-20 effects against the OFFICIAL canonical score remains not directly observable today (no active canonical script on testnet). Mitigation tracked: register a diagnostic scoring module via integrate.telegraphprotocol.com (benchmark reveals the canonical ground-truth corpus shape), confirm H1 spec/official Discord, and monitor the intent's canonical score once live.
  - ISSUE-002 updated: resolved in favor of consumer-owned comparison (DEC-002).
- Blockers:
  - None for Phase 1. BLOCK-001 cleared (branch 2 supported); BLOCK-003 cleared for the approved cap.
- Next exact action: Phase 2 - scaffold the repository (pinned toolchain, CI, env schema, secret scanning), implement the Veyctum Miner API (strict validation, parallel RPC lookup, finality, Transfer-log normalization for allowlisted Base USDC), and register a diagnostic scoring module for ONCHAIN_TX_LOOKUP via the integration sandbox to expose the canonical ground-truth corpus.

### CP-002A: Repository scaffold and core Miner API implemented (Phase 2)

- Status: Complete
- Date: 2026-08-17
- Agent: Executor
- Phase: Phase 2 - Complete a thin real routed lookup with inspectable proof
- Objective: Establish the minimal repository structure (pinned toolchain, CI, env schema, secret scanning) and implement the first vertical slice of the Miner API so a valid finalized Base tx returns versioned normalized facts.
- Work completed:
  - Pinned toolchain per plan: Node 24 LTS (24.19.0 via nvm), TypeScript 7.0.2, Fastify 5.12.0, viem 2.55.16, Zod 4.4.3, Vitest 4.1.10, tsx 4.23.12; exact versions saved to package.json/lockfile (NFR-002).
  - Created environment schema (Zod, strict) with fixed Base chain enforcement (FR-004, ADR-003), allowlisted USDC contract, independent RPC provider config, finality/confirmations, timeouts (src/config.ts). `.env.example` provided; `.env`/wallet files gitignored.
  - Implemented strict request boundary (FR-002/FR-003): Zod + Fastify JSON schema reject unknown fields (removeAdditional:false) and malformed/non-base requests.
  - Implemented parallel RPC gateway (FR-005): primary + fallback queried in parallel, critical-facts agreement, independent-response-only verdicts (ADR-005), per-provider timeout + total budget, TransactionNotFoundError mapped to explicit NOT_FOUND (all-provider agree), explicit RPC_DISAGREEMENT.
  - Implemented finality gate (FR-006): documented configured confirmations, `PENDING` until reached.
  - Implemented deterministic Transfer-log normalization (FR-007/FR-008/FR-014): allowlist by address, strict decoded Transfer logs, evidence per log, aggregation with bigint arithmetic, AMBIGUOUS on distinct triples.
  - Implemented versioned response envelope (FR-009) with states from FR-010 and structured redacted logging (NFR-006).
  - Added health/readiness endpoints (FR-025) and CI (github actions: typecheck, vitest, gitleaks secret scan).
  - Added README (quick start, states, security notes).
- Files or assets changed:
  - `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`, `.env.example`, `README.md`, `.github/workflows/ci.yml`
  - `src/{config,schemas,errors,rpc,normalize,service,server,app,domain}.ts`
  - `test/{schemas,normalize,server}.test.ts`
- Commands or checks run:
  - `npx tsc -p tsconfig.json --noEmit` -> 0 errors
  - `npx vitest run` -> 18 passed (3 files): validation, normalization/aggregation, server boundary, plus live Base RPC integration for the CP-001 fixture and NOT_FOUND
  - `npm run build` -> dist emitted; live smoke: `/health` 200, `/lookup?tx_hash=0x373982c2...16a7` 200 OK state with normalized effect (token 0x833589fcd6...02913, sender 0x2192bc3b..., recipient 0xb2cc224c..., raw_amount 237440081636, evidence block hash), 0.27s; malformed tx_hash -> 400 INVALID_INPUT
- Test results:
  - 18/18 pass; live integration against public Base mainnet RPC verified the CP-001 fixture returns the normalized USDC transfer effect that the incumbent (Verity) schema cannot express.
- Acceptance criteria verified:
  - Clean clone passes typecheck/tests (NFR-008) locally; CI configured to enforce in-repo.
  - Explicit states present for the FR-010 set (NOT_FOUND verified live; REVERTED/PENDING/RPC_DISAGREEMENT/downstream covered by unit paths and integration once fixture corpus is added in CP-003's adversarial corpus).
  - No secrets in repo (wallet key outside repo; env gitignored; gitleaks CI).
- Decisions:
  - RPC providers default: primary https://mainnet.base.org, fallback https://base.drpc.org (publicnode and llamarpc rejected live: receipt 403/invalid from this host; drpc verified working for all methods).
  - Internal address normalization is lowercase (RPCs return lowercase; viem getAddress throws); display checksums only at the boundary.
- Deviations:
  - None from plan. tsx pinned at 4.23.12 (plan's 4.19.5 does not exist on npm); recorded on 2026-08-17.
- Risks introduced:
  - Public free RPC providers can rate-limit; DEC-003 (provider choice) formally open before registration.
- Known issues:
  - ISSUE-001 residual (canonical scorer activation) unchanged; deployment + paid routed lookup pending a hosting decision (DEC-004) and are the next sub-checkpoint.
- Blockers:
  - None.
- Next exact action: CP-002C - deploy the Miner API to a hosting platform (user picks DEC-004), run one real paid routed Engine request through Telegraph to Veyctum, capture the signal hash, and measure direct vs routed p95 (NFR-003).

### CP-002B: Deploy + live proof + p95 (VPS + cloudflared quick tunnel)

- Status: Complete (deployment proof done; registered routed lookup to Veyctum deferred to registration checkpoint as planned)
- Date: 2026-08-17
- Agent: Executor
- Phase: Phase 2 - Complete a thin real routed lookup with inspectable proof
- Objective: Deploy the built Miner API, prove public health/lookup, and measure direct p95 (NFR-003 target <= 5s).
- Work completed:
  - Deployed `npm run build` output on this VPS at 127.0.0.1:8090 (Node 24, `node dist/app.js`), avoiding the port 8080 used by an existing named-tunnel service.
  - Exposed via cloudflared quick tunnel with `--config /dev/null` (the default config.yml ingress would 404 every request - recorded pitfall). Public URL: https://communications-meanwhile-deliver-started.trycloudflare.com
  - Verified public /health 200 and /lookup 200 (state OK, normalized effect raw_amount 237440081636, provider primary, 0.37s).
  - Measured direct p95 over the public URL: 356 ms (n=10; min 275, median 317, max 1113) - NFR-003 direct target <= 5s PASS.
  - Recorded a paid auto-routed Engine ask ($0.01) as the routed baseline: intent ONCHAIN_TX_LOOKUP routed to Verity (9001), duration_ms 943, signal 0x19ce0156...35e; verifies the routed loop reachable from this environment and documents the incumbent's effect-less answer vs Veyctum's normalized effect for the same fixture.
- Files or assets changed:
  - `evidence/phase2/README.md`
  - `evidence/phase1/paid/routed_baseline_*.json` (6 artifacts)
  - `PROJECT_STATE.md` (this entry)
- Commands or checks run:
  - `PORT=8090 HOST=127.0.0.1 node dist/app.js` (background)
  - `cloudflared --config /dev/null tunnel --url http://127.0.0.1:8090 --no-autoupdate` (background)
  - curl public /health, /lookup
  - 10x pubic lookup p95 benchmark (Python)
  - x402_probe.py auto-routed ask
- Test results:
  - Modeless pass: public health 200, public lookup 200 OK with effect, p95 356ms.
  - Engine routed baseline: ONCHAIN_TX_LOOKUP -> Verity, cost 0.01, 943ms, signal captured.
- Acceptance criteria verified:
  - Live deploy health/readiness proven over a public URL (FR-025).
  - Service returns versioned normalized facts for a valid finalized tx (FR-009).
  - Direct p95 measured, not assumed (NFR-003): 356 ms.
- Decisions:
  - Hosting (DEC-004) resolved for the probe: this VPS + cloudflared quick tunnel. The quick-tunnel subdomain changes on restart, so Miner registration must use a stable URL (named tunnel + DNS, or Railway) - flagged as a registration prerequisite.
  - Quick tunnel launched with --config /dev/null to bypass the existing named-tunnel ingress.
- Deviations:
  - None from plan. The "execute a real paid routed lookup to Veyctum" item intentionally requires registration first (engine routes only to registered miners); recorded as CP-003/registration milestone rather than claiming it here.
- Risks introduced:
  - Quick tunnel has no uptime guarantee; approved for the probe only.
  - Public free RPC rate limits; DEC-003 formally open before registration.
- Known issues:
  - ISSUE-001 residual unchanged.
- Blockers:
  - None.
- Next exact action: Registration checkpoint - pick a stable public URL (recommend named tunnel on breachresponse.xyz or Railway), host the Miner YAML with the live base_url (IPFS or stable host), compute and preserve the YAML hash, then perform the on-chain `registerMiner()` on Base Sepolia from the throwaway wallet (has ETH), and verify the live discovery entry. Then re-run the paid auto-routed Engine ask to include Veyctum and measure routed p95 (NFR-003 target <= 15s).

### CP-002C: Review-driven hardening + consumer proof gate (Phase 2)

- Status: Complete
- Date: 2026-08-17
- Agent: Executor
- Phase: Phase 2 - Complete a thin real routed lookup with inspectable proof
- Objective: Close every code-review finding (REV-001..REV-008) and build the consumer proof gate (FR-011..FR-020) so the winning invariant is operational and demonstrable before registration.
- Work completed:
  - REV-001: `RpcGateway.lookup` now fetches `eth_chainId` per provider; providers must agree AND report 8453 or the result is `RPC_DISAGREEMENT`/`UNSUPPORTED` (FR-005, FR-004, REV-006 producer wired).
  - REV-002: enforced the YAML-declared rate limit in code - fixed-window limiter per IP (`src/rateLimit.ts`), 4 rps default, 429 + Retry-After + X-RateLimit-* headers; `/health` and `/ready` exempt; Fastify `bodyLimit`/connection/request timeouts added (NFR-005).
  - REV-003: `GET /ready` is now a live dependency probe (chain id + head) via `RpcGateway.check()`; 503 + observed chain id when unreachable/mis-chained (FR-025, plan line 630).
  - REV-004: agreed-but-null receipt after finality now returns `PENDING` instead of `NO_SUPPORTED_TRANSFER` (indexing-lag window).
  - REV-005: absent log blockHash stays `null` in evidence instead of a fake `'0x'` sentinel (normalize.ts).
  - REV-006: `UNSUPPORTED` state now has a real producer (wrong-chain provider pair).
  - REV-007: error path never coerces non-string `tx_hash` into the echo.
  - REV-008: CI pins Node 24.19.0 and runs live integration tests in a separate job; unit run is hermetic (`vitest.integration.config.ts`, `test/live.integration.test.ts`).
  - Consumer proof gate (FR-011..FR-020, DEC-002 branch 2): pure comparator (`src/comparator.ts`: exact token/sender/recipient/raw-integer equality, sender from log, zero/self/mint/burn/token/sender/recipient/amount/ambiguous rejection), SQLite action store (`src/consumerStore.ts`, node:sqlite, atomic at-most-once transitions, append-only audit), HTTP surface (`src/consumer.ts`: create/list/get/verify; release requires a `signal_hash` - BR-007; retryable states keep `LOCKED` - FR-018; duplicates refused - FR-019/BR-008).
  - README, `.env.example`, `veyctum.yaml` (rate-limit comment now truthful), `.gitignore` (`data/`) updated.
- Files or assets changed: `src/{rpc,service,server,schemas,normalize,domain,config,app}.ts`, new `src/{rateLimit,comparator,consumerStore,consumer}.ts`, `test/{server,normalize,comparator,consumerStore,consumer,live.integration}.test.ts`, `vitest{,.integration}.config.ts`, `package.json`, `.github/workflows/ci.yml`, `.env.example`, `veyctum.yaml`, `.gitignore`, `README.md`, `PROJECT_STATE.md`. Review artifacts (`CODE_REVIEW.md`, `REVIEW_CONSOLIDATED.md`) are excluded from git via `.git/info/exclude`.
- Commands or checks run: `tsc --noEmit` (0 errors), `vitest run` (53/53 hermetic), `vitest run -c vitest.integration.config.ts` (3/3 live Base RPC incl. new readiness probe), `npm run build` (dist emitted), live smoke on :8190 with fresh SQLite DB: `/health` 200, `/ready` 200 with live chain_id 8453 + head, `/lookup` on the CP-001 fixture returns OK + normalized effect, `POST /consumer/actions` 201 LOCKED.
- Test results: 56/56 tests pass across both suites. Rate limit 429 verified in tests; positive release / negative rejection / NO_EFFECT / BR-007 / duplicate refusal / retryable-LOCKED all covered in `test/consumer.test.ts` + `test/consumerStore.test.ts`.
- Acceptance criteria verified: All 8 review findings closed; FR-011..FR-020 core implemented and tested; no secrets introduced; existing live behavior unchanged (fixture still OK with same normalized effect); state-file claims reproducible.
- Decisions: Use node:sqlite (built into Node 24 LTS) for the consumer store - zero new dependencies. Consumer verify endpoint accepts a real Veyctum lookup result plus Telegraph signal metadata; the paid x402 routing step remains the demo's external action (per CP-001 evidence).
- Deviations: None from plan. Test fixture arithmetic in the FR-014 split test was corrected during development (my initial split amounts did not sum to the expected total; aggregation logic itself validated correct).
- Risks introduced: In-memory rate limiter is single-process only (documented); node:sqlite WAL DB is a new local state artifact (gitignored, `data/`).
- Known issues: ISSUE-001 residual (canonical scorer activation) unchanged. RESOLVED: live deployment restarted on Node v24.19.0 (was v22.23.0) with the CP-002C build at commit d79f5d1; new quick-tunnel URL https://discover-tray-fin-simulation.trycloudflare.com, consumer DB at data/veyctum.db (gitignored). Quick-tunnel subdomain still rotates on restart - stable URL remains the registration prerequisite.
- Blockers: None for this checkpoint.
- Next exact action: Restart the live miner on Node 24.19.0 with the rebuilt `dist/` (and fresh DB), then proceed to the registration checkpoint: stable URL (named tunnel veyctum.breachresponse.xyz on :8090 or Railway), finalize `veyctum.yaml` base_url, host YAML + preserve hash (FR-027), `registerMiner()` on Base Sepolia from the funded throwaway wallet, verify live discovery, then capture the registered routed Engine ask routed to Veyctum + routed p95 (NFR-003 <= 15s), and register the diagnostic scoring module at integrate.telegraphprotocol.com (ISSUE-001).

## Decisions Made During Execution

| ID | Date | Decision | Reason | Plan impact |
|---|---|---|---|---|
| DEC-001 | 2026-08-17 | Canonical ONCHAIN_TX_LOOKUP request = transaction reference {chain, tx_hash}; no expected-effect fields exist in any accepted schema | Intent description + accepted Verity schema + live 402/paid probes | Miner input contract fixed; expectation fields not part of the request |
| DEC-002 | 2026-08-17 | Branch 2: Miner returns observed normalized facts incl. extended ERC-20 effects; consumer owns expectation comparison and action gate | Live probes: incumbent schema lacks effect fields; engine preserves full miner JSON in signals; Tier A deterministic scoring vs ground truth | Comparison logic lives in consumer (Phase 3+); Miner stays factual |
| DEC-008 | 2026-08-17 | Phase 1 x402 spend cap approved by user: 10 calls at $0.01; $0.02 used | User approval; minimal cost to prove sponsor integration | Budget fixed for Phase 1 diagnostics |

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
| ISSUE-001 | High | Official canonical scorer for ONCHAIN_TX_LOOKUP is not yet active on the testnet, so direct proof that the score rewards ERC-20 effect fields is not yet observable. Branch 2 boundary is supported by live evidence regardless. | Miner returns extended normalized effects; consumer compares; monitor canonical score once live | Register diagnostic scoring module via integrate (observes benchmark corpus); confirm H1 spec/Discord; re-verify after scorer activation |
| ISSUE-002 | Resolved | Official question may not contain expected payment fields. Confirmed: accepted request is a transaction reference with no expectation fields. | Comparison lives in consumer (DEC-002) | None |
| ISSUE-003 | High | Valid real Track 3 request rules are not fully clarified. | Publish a conservative rule and exclude questionable traffic. | Resolve `DEC-006` in official Discord. |
| ISSUE-004 | Resolved | Budget and testnet funds unspecified. Phase 1 cap approved (10 calls, $0.02 used). | - | Phase 2+ budget decision per plan before further spend |
| ISSUE-005 | Medium | RPC, hosting, durable database, and protected action choices are open. | Plan defines decision criteria. | Resolve `DEC-003-DEC-005` by phase deadlines. |

## Blockers

| ID | Description | Impact | Required resolution |
|---|---|---|---|
| BLOCK-001 | Canonical ERC-20 effect scoreability unknown | Cleared: branch 2 supported by live paid evidence; scorer-activation verification tracked as ISSUE-001 | - |
| BLOCK-002 | Implementation start permission/timing | Cleared: Track 1 opened 2026-08-17 12:00 UTC per official rules | - |
| BLOCK-003 | x402 and registration spend cap/funding unavailable | Cleared for Phase 1: cap approved, wallet funded, $0.02 used | - |

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

Registration checkpoint: (1) choose a stable public URL for the Miner (recommend a named cloudflared tunnel hostname such as veyctum.breachresponse.xyz added to the existing ingress on port 8090, or Railway) so the base_url survives restarts; (2) finalize `veyctum.yaml` with the live base_url and validate through the integrate portal/CLI; (3) host the YAML (IPFS pin or stable host) and preserve its hash (FR-027); (4) perform on-chain `registerMiner()` on Base Sepolia from the funded throwaway wallet (0x65aE39Fd..., testnet ETH held) and verify the live discovery entry. Then re-run the paid auto-routed Engine ask with a tx-reference query so routing includes Veyctum, capture the signal, and measure routed p95 (NFR-003 <= 15s). In parallel, register a diagnostic scoring module for ONCHAIN_TX_LOOKUP at integrate.telegraphprotocol.com to observe the canonical benchmark corpus (ISSUE-001 residual).
