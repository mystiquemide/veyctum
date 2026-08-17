# Phase 1 evidence — CP-001 (2026-08-17)

Read-only snapshots captured from the live Telegraph testnet and official sources.
Paid-request evidence will be appended here after the x402 wallet step is approved.

| File | Source | Note |
|---|---|---|
| `intents_onchain.json` | GET https://devnode.telegraphprotocol.com/engine/v1/intents | Full intent list (45 canonical), ONCHAIN_TX_LOOKUP canonical |
| `intent_onchain_miners.json` | GET .../engine/v1/intents/ONCHAIN_TX_LOOKUP/miners | Miner count 2: Verity (9001), VulnFeed (10001), both cost_per_call 0.00 |
| `intent_onchain_details.json` | GET .../engine/v1/intents/ONCHAIN_TX_LOOKUP | Description: transaction hash/reference -> details, status or effects |
| `miners_api.json` | GET .../api/miners?intent=ONCHAIN_TX_LOOKUP | Schemas, signal mappings, min_price_usdc (10000 = $0.01) |
| `wasm_registry.json` | GET .../engine/v1/intents/ONCHAIN_TX_LOOKUP/wasm | All 5 registered scoring scripts rejected; no active canonical script |
| `daemon_questions_2000.json` | GET http://13.237.89.59:7044/daemon/api/questions (paged) | 2,000 rows; exactly 1 ONCHAIN_TX_LOOKUP row (misrouted news question) |
| `daemon_tx_lookup_row.json` | Row from daemon_questions_2000.json | VulnFeed answered a news question with a security report (fallback misrouting) |
| `signal_0xd80947...json` | GET .../engine/v1/signal/0xd80947b6533d5d1c2dca3a9d4873092628e3779136002b073b6132238c0cc8e9 | Signal lookup shape: request/response/payload (hash re-derivable) |
| `x402_direct_ask_9001.json` | POST .../engine/v1/ask/9001 (no payment header) | 402 challenge: $0.01, eip155:84532 USDC 0x036CbD..., payTo 0x5a2324aA18613FAD4e44bDF0d6c73Ec1f6D87ff8, 60s |
| `x402_auto_ask.json` | POST .../engine/v1/ask (no payment header) | Same terms for auto-routed ask |

## Paid probe results (2026-08-17, $0.02 total on Base Sepolia USDC)

| Probe | Endpoint | Result | Signal hash | Settlement tx (Base Sepolia) |
|---|---|---|---|---|
| Direct ask -> Verity (9001) | GET /lookup {chain: base, tx_hash: 0x373982c2...16a7} | 200; status confirmed_success, block 50101700, from/to/value match on-chain truth; NO ERC-20 effect fields | 0xbbe9906e1e09e357e9225f0c066e9c47732539e30f8da3c9d5e56a632cad98cf | 0x92fbb45dc6496cf061c5139130e5f0116a7d59ddbff18586d8becfa7424feb49 |
| Auto-routed ask | query: "Look up the status, details and token transfer effects of Base transaction 0x373982c2...16a7" | 200; router classified ONCHAIN_TX_LOOKUP -> Verity (9001); identical result to direct | 0xb831d5774cacb1e75d12e6ce3672014d30343f5208994330775f61f21a5883fb | 0xa7285d28c9e6d66bfee4180fc4aad704b71c1b5c43ec199bb0bcc4a277049043 |

Fixture ground truth (independent, public Base mainnet RPC): tx 0x373982c2...16a7
block 50101700, status 0x1, from 0x4506de02..., to 0x2192bc3b..., value_wei 0,
USDC (0x833589fC...) Transfer 237440081636 base units ($237,440.08) from 0x2192bc3b... to 0xb2cc224c....

Key observations:
- The engine preserves the miner's full structured JSON in the recorded signal payload
  (custom fields survive verbatim; consumer-verifiable).
- The on-intent incumbent returns NO ERC-20 transfer effect fields (no token address,
  no token amount, no log data) - only chain|tx|status|block|from|to|value_wei.
- Tier A deterministic scoring compares miner answer text against canonical ground truth;
  the canonical scoring script for this intent is not yet active on the testnet
  (all registered candidates rejected; champion internal).
- Direct and auto-routed results are semantically equivalent for the same fixture.

## Key facts

- ONCHAIN_TX_LOOKUP = Tier A deterministic WASM exact-match intent (official docs, Intents page).
- Verity (9001) input: {chain, tx_hash}; output: chain, chain_id, tx_hash, status, from, to, value_wei,
  block_number, canonical (label), confidence, summary. No ERC-20 transfer-effect fields.
- VulnFeed (10001) input: {address}; output: security report (off-intent for tx lookup).
- No scoring module has been accepted for any intent on this testnet; canonical champion scorer is internal.
- Payment settles only on successful answers. First request returns a free 402 challenge.

## Official sources reviewed

- https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module (WASM rank_answer(q, gt, ma) -> 0..1)
- https://docs.telegraphprotocol.com/docs/using/engine-ask (auto + direct ask, signal_hash)
- https://docs.telegraphprotocol.com/docs/using/x402-inference (payment networks, verify-by-hash)
- https://docs.telegraphprotocol.com/docs/using/intents (Tier A/B table)
- https://hackathon.telegraphprotocol.com/rules (75% normalized performance / 25% X; 3-Miner + 100-request guardrails)
- https://github.com/telegraphprotocol/Telegraph-api-docs (OpenAPI specs: engine, daemon, dispatcher)