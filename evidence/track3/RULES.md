# Track 3 request-validity rules

Status: live collection enabled on 2026-09-07. Track 3 opens 2026-08-31 00:00 UTC and closes 2026-09-07 23:59 UTC.

These rules were published before the collection window. They are intentionally stricter than the minimum hackathon wording so any reported demand is auditable and conservative.

## What counts

A counted request must satisfy every condition below:

1. A real person starts a completed verification flow in the Veyctum Proof application.
2. The application sends the request through the Telegraph Engine to live Miner `9005` for `ONCHAIN_TX_LOOKUP`. Direct requests to Veyctum's `/lookup` endpoint are not Track 3 application requests.
3. Telegraph returns a successful x402 payment settlement and a signal that preserves the Veyctum response.
4. The request uses a real EVM transaction hash and returns a completed answer or an explicit definitive non-success state. Failed, timed-out, or abandoned requests do not count.
5. One completed verification flow produces at most one counted request. Retries are deduplicated by the application.
6. The same anonymized session has a 60-second cooldown. Repeated requests from one session are not used to inflate the total.
7. The project author's own sessions and operator smoke tests are excluded from the reported total.
8. The request occurs inside the official Track 3 window in UTC.

The application records only the minimum anonymized audit metadata needed to reconcile the count: timestamp, truncated session digest, transaction hash, signal hash, settlement status, and duration. Raw IP addresses, credentials, and payment authorizations are never published.

## What does not count

- self-run probes or health checks;
- direct Miner calls that bypass a Track 3 application;
- mock, simulated, replayed, or synthetic traffic;
- scripts, bots, loops, or automated click farms;
- repeated requests from the author or one session;
- requests before 2026-08-31 or after 2026-09-07;
- failed or unsettled x402 requests;
- requests made only to test deployment health;
- paid traffic, reciprocal click arrangements, or incentives to manufacture usage.

## Application status

The Veyctum Proof app is live at https://proof.midelabs.xyz/ inside the official UTC window. Paid Engine forwarding is enabled. The deployment rejects the configured operator smoke-test session and operator payer wallet before any paid retry is forwarded or counted. Live mode and the current reconciled total are exposed at https://proof.midelabs.xyz/track3/status.

The ledger is append-only and remains empty until a real external application request completes with a successful x402 settlement and a Telegraph signal. No demand total or eligibility claim is made before reconciliation against the signal and settlement artifacts.

The final report will publish the valid-request total, the anonymized ledger, the date window, the number of distinct session digests, and excluded-request reasons. No eligibility claim will be made before the ledger is reconciled against Telegraph signals and settlements.

The ledger opens empty and is only appended after the window opens with paid collection enabled. No Track 3 demand is counted before a settled external request exists.

## Sources

- Official rules: https://hackathon.telegraphprotocol.com/rules
- Hackathon overview: https://hackathon.telegraphprotocol.com/
- Telegraph Engine docs: https://docs.telegraphprotocol.com/
- Current Miner manifest: https://veyctum.splitpot.xyz/veyctum.yaml
- Current Explorer registration: https://explorer.telegraphprotocol.com/api/miners/262
