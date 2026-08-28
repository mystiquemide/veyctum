# CP-002G: Paid request through active Miner 9005 (2026-08-25)

This phase records a direct x402 request through Telegraph Miner `9005` while
Explorer registration `104` was active. Replacement registration `213` committed
the newer manifest hash but was rejected because its YAML URL was malformed.
Explorer registration `262` later corrected the URL and is now the active
submission identity.

## Paid request

- Endpoint: `POST https://devnode.telegraphprotocol.com/engine/v1/ask/9005`
- Request: `GET /lookup` with `chain=base`, `format=full`, and the finalized Base fixture
- Payment: `$0.01` USDC on Base Sepolia (`eip155:84532`)
- Result: HTTP `200`
- Duration: `1444 ms`
- Cost: `$0.01`
- Signal: `0xe39910a3033965102effcac686b5f25e18e3a5121b5e6e5fe7c26d6b2cee4e69`
- Settlement transaction: `0xce3321bd3d1c05ee80cfd1e1f3ecb70835167eb946712749405b097592f88ec2`

## Miner result

- State: `OK`
- Chain: Base (`8453`)
- Finality: reached, `350926` confirmations at response time
- Normalized Base USDC effect: `237440081636` raw units from
  `0x2192bc3b4028acc1113f2cd9ac2cba70c36520db` to
  `0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59`
- Full structured response and signal response retained in `ask9005/`; the
  signed payment authorization is intentionally excluded from the public repo.

The raw request, challenge, response, settlement metadata, and signal response
are retained in the adjacent timestamped files. The signed payment payload is
retained locally only and is not part of the public repository.
