# Phase 3 evidence — real paid Telegraph request served by Veyctum + positive loop released

Date: 2026-08-17. Miner id 9005, registered this session (CP-002E).

## Direct paid Engine ask -> Veyctum (9005)

- Endpoint: POST https://devnode.telegraphprotocol.com/engine/v1/ask/9005
- Request body: {"method":"GET","endpoint":"/lookup","payload":{"chain":"base","tx_hash":"0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7"}}
- Engine forwarded /lookup to https://veyctum.splitpot.xyz/lookup (id 9005 routed)
- Response: full Veyctum normalized result - state OK, USDC Transfer 237440081636
  (token 0x833589fc..., sender 0x2192bc3b..., recipient 0xb2cc224c...), evidence + finality 6187 confirmations
- cost_usd: 0.01, duration_ms: 1663 (routed p95 target <= 15s PASS)
- signal_hash: 0x8b782fecb8b5f92e5e5c4307ede66b2a3b462bfbac6014ca9e289281ffb4ef50
- Signal resolves: miner_slug veyctum, subnet_id 9005, recorded payload preserves the
  full miner JSON (normalized effect fields intact) - independent verifiers can reconstruct it.
- Payment settlement (Payment-Response header decoded): success true,
  payer 0x65ae39fd36f2a9fa8d738a0fac369c0cdc507a99,
  tx 0xc9af86610f2c58822b662c5adcad698a5ef7d02321f55c1f1ee1fba88bc6bde9,
  network eip155:84532 (Base Sepolia)
- Public artifacts: ask9005/probe_20260817T221841Z_{challenge,meta,request,response,signal}.json. The signed payment authorization is retained locally only.
- Explorer: https://sepolia.basescan.org/tx/0xc9af86610f2c58822b662c5adcad698a5ef7d02321f55c1f1ee1fba88bc6bde9

## Positive loop: consumer gate released on the real signal (self-sufficient verify)

- POST /consumer/actions {action_id: e2e-real-signal, expected: fixture USDC transfer}
  -> 201 LOCKED
- POST /consumer/actions/e2e-real-signal/verify {tx_hash: fixture, signal_hash:
  0x8b782fec..., miner_id: veyctum} -> 200
- Server-side (REV-009 path): fetched live two-provider lookup (OK, same effect) +
  resolved the real Telegraph signal + verified signal effect data == independent
  observation -> comparator MATCHED -> action RELEASED (once)
- released_by_signal: 0x8b782fec... ; elapsed ~1.3s
- This is the winning invariant operational: real paid Telegraph request -> real
  state transition, fully verified, no caller-supplied facts trusted.

## Spend

- x402 spend to date (Phase 1 cap 10 calls / $0.10): CP-001 direct + auto-routed
  ($0.02) + CP-002B routed baseline ($0.01) + this ask ($0.01) = $0.04 total.
- Base Sepolia ETH used for gas: registration 0.000383781 (settlement relayed by facilitator).
