#!/usr/bin/env bash
set -euo pipefail

# Replays the recorded real positive and negative consumer proofs.
# Required: BASE_URL and CONSUMER_API_KEY.
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
: "${CONSUMER_API_KEY:?Set CONSUMER_API_KEY to the deployment or local consumer key}"

POS_TX="0x373982c25ba2c56c52c30a6db4ea14f9af267d6152f09f14f0b9b43e842e16a7"
POS_SIGNAL="0x8b782fecb8b5f92e5e5c4307ede66b2a3b462bfbac6014ca9e289281ffb4ef50"
NEG_TX="0x5c8ea6c032bbba661648924da38a8ecf67bafcf92a8cc81ad58af000f7620994"
NEG_SIGNAL="0x9ea3e072c53bf1904478b2388ae345991595e848924a580c670a92a9db5a87a0"
TOKEN="0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913"
SENDER="0x2192bc3b4028acc1113f2cd9ac2cba70c36520db"
RECIPIENT="0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59"
AMOUNT="237440081636"

run_case() {
  local action_id="$1" tx="$2" signal="$3" expected_amount="$4"
  curl -fsS -X POST "$BASE_URL/consumer/actions" \
    -H 'content-type: application/json' -H "x-consumer-api-key: $CONSUMER_API_KEY" \
    --data "{\"action_id\":\"$action_id\",\"expected\":{\"chain_id\":8453,\"token\":\"$TOKEN\",\"sender\":\"$SENDER\",\"recipient\":\"$RECIPIENT\",\"raw_amount\":\"$expected_amount\"}}" >/dev/null
  curl -fsS -X POST "$BASE_URL/consumer/actions/$action_id/verify" \
    -H 'content-type: application/json' -H "x-consumer-api-key: $CONSUMER_API_KEY" \
    --data "{\"tx_hash\":\"$tx\",\"signal_hash\":\"$signal\",\"miner_id\":\"veyctum\"}"
  printf '\n'
}

echo 'Positive proof (exact transfer -> RELEASED):'
run_case "judge-positive-$(date +%s)" "$POS_TX" "$POS_SIGNAL" "$AMOUNT"

echo 'Negative proof (approval-only transaction -> REJECTED / NO_EFFECT):'
run_case "judge-negative-$(date +%s)" "$NEG_TX" "$NEG_SIGNAL" "1"
