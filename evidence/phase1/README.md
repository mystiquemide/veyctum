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