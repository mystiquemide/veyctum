# Veyctum evidence index

This directory contains the reproducible proof behind the claims in the main README.

The shortest review path is below.

## 1. Registration

[`registration/`](./registration/)

Confirms the Base Sepolia registration history. Explorer registration `262` is the current active submission identity and commits the hosted multi-chain manifest hash. Registration `104` is the original integration, while replacement registration `213` was rejected because its YAML URL was malformed.

## 2. Telegraph compatibility and paid request groundwork

[`phase1/`](./phase1/)

Contains the early Telegraph Engine/x402 probes used to verify the request, payment, signal, and settlement path before Veyctum registration.

## 3. Live Miner and routing evidence

[`phase2/`](./phase2/)

Contains deployment and live Miner evidence used to establish the stable public service and Telegraph-facing request path.

## 4. Positive end-to-end proof

[`phase3/`](./phase3/)

A real paid Telegraph request was sent directly to Veyctum Miner `9005` for a real finalized Base USDC transfer.

Result:

- Veyctum returned the normalized transfer effect.
- Telegraph preserved the result in a real signal.
- x402 settlement succeeded on Base Sepolia.
- The reference consumer independently resolved the transaction and signal.
- The protected action changed from `LOCKED` to `RELEASED` exactly once.

Key signal:

`0x8b782fecb8b5f92e5e5c4307ede66b2a3b462bfbac6014ca9e289281ffb4ef50`

## 5. Negative end-to-end proof

[`phase4/`](./phase4/)

A real Base transaction successfully executed an ERC-20 approval but produced no payment transfer effect.

Result:

- Receipt status was successful.
- Veyctum returned `NO_SUPPORTED_TRANSFER` with `effects=[]`.
- Telegraph preserved that result in a real paid signal.
- The reference consumer rejected the protected action with `NO_EFFECT`.
- A duplicate verification attempt could not flip the rejected action.

Key signal:

`0x9ea3e072c53bf1904478b2388ae345991595e848924a580c670a92a9db5a87a0`

This is the central Veyctum invariant demonstrated with real infrastructure:

> **Transaction succeeded. Payment did not.**

## What the raw artifacts show

The nested evidence folders intentionally retain machine-readable request, response, signal, and settlement artifacts. They are included so a reviewer can inspect the exact protocol exchange rather than relying on screenshots or narrative claims.
