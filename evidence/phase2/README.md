# CP-002B deployment evidence (2026-08-17)

- Original live URL (cloudflared quick tunnel, --config /dev/null): https://communications-meanwhile-deliver-started.trycloudflare.com (superseded by restart below)
- Origin: VPS 159.69.241.122:8090
- Quick-tunnel subdomain CHANGES on restart; stable URL (named tunnel + DNS or Railway) required before Miner registration.
- GET /health over tunnel: HTTP 200 ({"status":"ok","service":"veyctum",...})
- GET /lookup?tx_hash=0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7 over tunnel:
  HTTP 200, state OK, status success, effect raw_amount 237440081636, provider primary, 0.37s

## CP-002C restart (2026-08-17, Node 24.19.0 + hardened build)

- Restarted the Miner on the pinned Node v24.19.0 (nvm) with the CP-002C build (rate limit,
  live /ready probe, consumer gate). New Node 22.23.0 process on :8090 replaced.
- New live URL (quick tunnel): https://discover-tray-fin-simulation.trycloudflare.com
- Verified over the public URL: /health 200, /ready 200 with live chain_id 8453 + head,
  /lookup (fixture) 200 OK + effect raw_amount 237440081636, POST /consumer/actions 201 LOCKED.
- SQLite consumer DB at data/veyctum.db (gitignored).

## Direct p95 (public URL, 10 requests, same fixture)
- p95 = 356 ms   (min 275, median 317, max 1113)
- NFR-003 target: direct <= 5s p95 -> PASS by wide margin.

## Paid auto-routed Engine ask (routed baseline, $0.01)
- Query: "What are the status, details and effects of Base transaction 0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7?"
- Engine classified ONCHAIN_TX_LOOKUP -> Verity (9001); duration_ms 943; cost 0.01
- Signal: 0x19ce0156de5c75116f8c60b3aea0826d5d60c57703ecf03dbbff6535bb03565e
- Verity answer carries no ERC-20 effect; Veyctum serves the same fixture with the normalized effect.
- Once Veyctum is registered, this routed loop includes Veyctum.

Artifacts: evidence/phase1/paid/routed_baseline_*.json (request/challenge/paymentpayload/meta/response/signal).