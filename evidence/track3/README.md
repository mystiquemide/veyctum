# Track 3 live application evidence

The production **Veyctum Proof** app is live at https://proof.midelabs.xyz/ during the official UTC window, forwarding completed user flows through Telegraph Miner `9005`.

The application status endpoint is https://proof.midelabs.xyz/track3/status. It reports the active window, live/closed mode, reconciled valid-request count, and distinct anonymized sessions. The public ledger is https://proof.midelabs.xyz/track3/ledger.jsonl.

- Rules: [`RULES.md`](./RULES.md)
- Current Miner: `9005`
- Active Explorer registration: `262`
- Current Miner endpoint: https://veyctum.splitpot.xyz
- Current Explorer record: https://explorer.telegraphprotocol.com/api/miners/262

## Ledger schema

Each accepted request is one JSON object per line with this shape:

```json
{"timestamp":"2026-08-31T00:00:00Z","session_digest":"sha256:truncated","tx_hash":"0x...","signal_hash":"0x...","settled":true,"duration_ms":1234}
```

The ledger is appended only after the request passes the rules in `RULES.md` and Telegraph confirms a successful x402 settlement. It contains no raw IP addresses, private keys, payment authorizations, or other credentials.

## Verification status

- [x] Publish request-validity rules before the window opens
- [x] Confirm Miner `9005` and active registration `262`
- [x] Confirm the hosted manifest and registered hash agree
- [x] Prepare the under-three-minute proof demo
- [x] Deploy Veyctum Proof at https://proof.midelabs.xyz/
- [x] Enable paid collection inside the official UTC window with session and payer exclusions
- [ ] Collect real external application requests during the official window
- [ ] Reconcile the ledger with Telegraph signals and x402 settlements

The last verified production status had `mode: live`, `valid_requests: 0`, and `distinct_sessions: 0`. No demand or cash-prize eligibility claim is made until the ledger is reconciled against the corresponding Telegraph signals and settlements.
