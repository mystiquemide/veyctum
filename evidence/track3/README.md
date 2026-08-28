# Track 3 preparation

The planned Track 3 application is **Escrow Verifier**. It is a small, public workflow that lets a user submit an EVM transaction hash and inspect whether the expected payment effect was observed before a protected action proceeds.

The preparation page is deployed, but paid collection is disabled and no Track 3 demand is counted during preparation. The official window is 2026-08-31 through 2026-09-07 UTC.

- Rules: [`RULES.md`](./RULES.md)
- Current Miner: `9005`
- Active Explorer registration: `262`
- Current Miner endpoint: https://veyctum.splitpot.xyz
- Current Explorer record: https://explorer.telegraphprotocol.com/api/miners/262

## Ledger schema

When paid collection is enabled, its append-only ledger will use one JSON object per line with this shape:

```json
{"timestamp":"2026-08-31T00:00:00Z","session_digest":"sha256:truncated","tx_hash":"0x...","signal_hash":"0x...","settled":true,"duration_ms":1234}
```

The ledger will be published only after a request passes the rules in `RULES.md`. It will not contain raw IP addresses, private keys, payment authorizations, or other credentials.

## Preparation checklist

- [x] Publish request-validity rules before the window opens
- [x] Confirm Miner `9005` and active registration `262`
- [x] Confirm the hosted manifest and registered hash agree
- [x] Prepare the under-three-minute proof demo
- [x] Deploy Escrow Verifier preparation page at https://veyctum.splitpot.xyz/track3
- [ ] Enable paid collection after the official window opens and operator exclusions are configured
- [ ] Collect real application requests during the official window
- [ ] Reconcile the ledger with Telegraph signals and x402 settlements

No request total is claimed yet.
