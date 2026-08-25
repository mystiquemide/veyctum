# CP-002E/CP-002F: Miner registration evidence (2026-08-17 / 2026-08-25)

## Replacement registration (Base Sepolia, 2026-08-25)

- Tx: 0xfb1a5f22259d6096f664a03048b53b1c5a8e27a2a1e7e28cdf1a3a02680afdbd
- registrationId: 213
- yamlHash: `0x3191ebf32c287925d197d56214450106aa610738223d45cc210f206da64484c8`
- status: success; on-chain record active=true
- The Telegraph discovery API may continue to show legacy ID 9005 until node-side rehydration completes.

## On-chain registration (Base Sepolia)

- Tx: 0xd94ac2357a6c7c1ba439837fb1c57a0b5a959a9f01405602e2d30e87b65c7a95
  - Explorer: https://sepolia.basescan.org/tx/0xd94ac2357a6c7c1ba439837fb1c57a0b5a959a9f01405602e2d30e87b65c7a95
  - Block: 45617652, status success, gasUsed 383781
- Diamond (X402 payTo): 0x5a2324aA18613FAD4e44bDF0d6c73Ec1f6D87ff8
- registrationId: 104
- intentId: 0xb64a28c5ae8c12d94b11d416d47e724122403f4626f7242730465b6822609e71
- miner (wallet): 0x65aE39Fd36f2a9Fa8d738A0FaC369c0CDc507a99 (registration-only throwaway, nonce 0 prior)
- feeAddress: 0x65aE39Fd36f2a9Fa8d738A0FaC369c0CDc507a99
- minPriceUsdc: 10000 ($0.01)
- supportedIntents: [ONCHAIN_TX_LOOKUP]
- yamlUrl: https://veyctum.splitpot.xyz/veyctum.yaml
- yamlHash (SHA-256 of exact hosted bytes): 0x8b29b2a6754922f81f7250bd36b17d418923716deebaa19515d3f4de69b35a52
- getMiner(104) read-back after activation: active=true, all fields match above

## Pre-flight verification (all passed)

- Diamond contract code exists on Base Sepolia; getCanonicalIntents() = 45 incl. ONCHAIN_TX_LOOKUP; isCanonicalIntent("ONCHAIN_TX_LOOKUP")=true
- YAML schema-valid per docs: version "1", kind miner, id 9005 (confirmed FREE: 9001-9004 = Verity family, 10001 = VulnFeed), slug veyctum (kebab), name, base_url https://veyctum.splitpot.xyz; signal_mapping label/reason only (no banned type); auth.type none; endpoint /lookup with external_path + param_map
- Hosted YAML bytes == repo bytes == hashed bytes (verified via curl | diff | sha256sum)
- Endpoint sandbox path verified live: https://veyctum.splitpot.xyz/lookup?tx_hash=<fixture>&chain=base -> 200 OK with normalized effect
- simulateContract passed before broadcast (no expected revert)

## Deployment (stable URL)

- VPS 159.69.241.122 (Hetzner), port 8090 = Node 24.19.0 miner (dist build, commit 41b0844+)
- Caddy reverse proxy: veyctum.splitpot.xyz -> 127.0.0.1:8090 (health/ready/lookup all verified)
- Caddy file server: /var/www/veyctum/veyctum.yaml -> https://veyctum.splitpot.xyz/veyctum.yaml
- DNS: A veyctum.splitpot.xyz -> 159.69.241.122 (external registrar), Let's Encrypt cert CN=veyctum.splitpot.xyz

## Status

- On-chain: ACTIVE (getMiner active=true, intentId set)
- Discovery (devnode /api/miners): pending node-side rehydration - not yet listed at time of writing
- Wallet balance after gas: 0.009 ETH - 0.000383781 ETH = 0.008616219 ETH
