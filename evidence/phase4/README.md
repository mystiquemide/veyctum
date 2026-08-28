# Phase 4 evidence — negative loop: successful tx, expected payment did NOT occur, action stayed blocked

Date: 2026-08-17. Miner id 9005.

## Negative fixture (real Base mainnet tx)

- tx: 0x5c8ea6c032bbba661648924da38a8ecf67bafcf92a8cc81ad58af000f7620994
  - Explorer: https://basescan.org/tx/0x5c8ea6c032bbba661648924da38a8ecf67bafcf92a8cc81ad58af000f7620994
  - Block 50108238, receipt status SUCCESS (EVM execution succeeded)
  - to 0x833589fc... (USDC), from 0x7726b398..., method approve (selector 0x095ea7b3)
  - Approval-only: no Transfer event, no payment effect
- Veyctum /lookup: state NO_SUPPORTED_TRANSFER, status success, effects [], finality reached (>= 43 conf)

## Paid Engine ask -> Veyctum (9005) for the negative tx

- POST /engine/v1/ask/9005, payload {"method":"GET","endpoint":"/lookup","payload":{"chain":"base","tx_hash":"0x5c8ea6c0..."}}
- Veyctum returned NO_SUPPORTED_TRANSFER (successful receipt, zero effects), duration_ms 1236, cost 0.01
- signal_hash: 0x9ea3e072c53bf1904478b2388ae345991595e848924a580c670a92a9db5a87a0
  (miner_slug veyctum, subnet_id 9005, routing "user-directed"; recorded payload effects [] preserved)
- Public artifacts: ask9005_negative/probe_20260817T223204Z_{challenge,meta,request,response,signal}.json. The signed payment authorization is retained locally only.

## Consumer negative flow (THE invariant, enforced live)

- POST /consumer/actions {action_id: e2e-negative-real, expected: fixture USDC transfer
  (sender 0x2192bc3b..., recipient 0xb2cc224c..., raw_amount 237440081636)} -> 201 LOCKED
- POST /consumer/actions/e2e-negative-real/verify
  {tx_hash: 0x5c8ea6c0..., signal_hash: 0x9ea3e072..., miner_id: veyctum} -> 200
  - server-side: live two-provider lookup (NO_SUPPORTED_TRANSFER, effects []) +
    resolved real signal + effect cross-check ([] == []) -> comparator NO_EFFECT
  - verdict: matched=false, outcome REJECTED
  - action: REJECTED, reject_reason "semantic mismatch (NO_EFFECT): transaction produced no
    supported transfer effect matching the frozen expectation", released_by_signal null (blocked)
- Duplicate verify on the same tx+signal -> refused_duplicate true, status stays REJECTED
  (cannot be flipped to a release; BR-008/FR-019)

## Result

"Transaction succeeded. Payment did not." — a real successful Base tx moved no payment the
consumer expected; the $237,440.08 protected action remained blocked, intentionally, with a
real paid Telegraph signal as evidence (not a crash, not a retryable error).

## Spend

- x402 total to date: $0.05 of the $0.10 Phase 1 cap (CP-001 0.02, CP-002B 0.01, phase3 +1 = 0.04, this +0.01 = 0.05)
