#!/usr/bin/env python3
"""CP-001 x402 probe client - Veyctum Phase 1 scoreability spike.

Reproduces the paid Telegraph Engine ask flow (x402 v2, exact/eip3009 scheme):

1. POST the ask without payment -> HTTP 402 PaymentRequired challenge.
2. Sign an EIP-3009 transferWithAuthorization for the chosen accepted requirement.
3. Retry with PAYMENT-SIGNATURE header (base64 PaymentPayload).
4. Print the response, capture signal_hash and PAYMENT-RESPONSE header.

The wallet private key is read from --wallet (JSON: {"address","private_key"})
or WALLET_JSON env var. Key material NEVER goes into the repo or logs.

Usage:
  python3 scripts/probe/x402_probe.py \
    --base https://devnode.telegraphprotocol.com \
    --ask /engine/v1/ask/9001 \
    --body '{"method":"GET","endpoint":"/lookup","payload":{"chain":"base","tx_hash":"0x..."}}' \
    --wallet /root/.veyctum-phase1-wallet.json \
    --outdir evidence/phase1

Verified against the official spec:
  https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md
  https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_evm.md
"""
import argparse
import base64
import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get("TG_BASE", "https://devnode.telegraphprotocol.com")
TOKEN = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"  # Base Sepolia USDC
CHAIN_ID = 84532
TOKEN_NAME = "USDC"    # verified via name() on sepolia.base.org
TOKEN_VERSION = "2"    # verified via version()

from eth_account import Account
from eth_account.messages import encode_typed_data


def http(method, url, body=None, headers=None, timeout=45):
    req = urllib.request.Request(url, method=method)
    req.add_header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
    if body is not None:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(body).encode()
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, dict(resp.headers), resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read().decode()


def get_challenge(base_url, ask_path, body):
    status, headers, resp = http("POST", base_url + ask_path, body)
    print(f"[1] challenge request: {status}")
    if status != 402:
        sys.exit(f"expected 402, got {status}: {resp[:400]}")
    chall = json.loads(base64.b64decode(headers.get("Payment-Required", "")))
    return chall, resp


def pick_evm(chall):
    for opt in chall["accepts"]:
        if opt.get("network") == f"eip155:{CHAIN_ID}":
            return opt
    sys.exit("no eip155:84532 option in challenge: " + json.dumps(chall["accepts"]))


def sign_auth(key, acct, req):
    valid_before = int(time.time()) + int(req.get("maxTimeoutSeconds", 60))
    valid_after = int(time.time()) - 5
    nonce = "0x" + secrets.token_hex(32)
    amount = req["amount"]
    pay_to = req["payTo"]
    structured = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "TransferWithAuthorization": [
                {"name": "from", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "value", "type": "uint256"},
                {"name": "validAfter", "type": "uint256"},
                {"name": "validBefore", "type": "uint256"},
                {"name": "nonce", "type": "bytes32"},
            ],
        },
        "primaryType": "TransferWithAuthorization",
        "domain": {
            "name": TOKEN_NAME,
            "version": TOKEN_VERSION,
            "chainId": CHAIN_ID,
            "verifyingContract": TOKEN,
        },
        "message": {
            "from": acct.address,
            "to": pay_to,
            "value": amount,
            "validAfter": str(valid_after),
            "validBefore": str(valid_before),
            "nonce": nonce,
        },
    }
    signed = Account.sign_typed_data(key, full_message=structured)
    auth = {
        "from": acct.address,
        "to": pay_to,
        "value": amount,
        "validAfter": str(valid_after),
        "validBefore": str(valid_before),
        "nonce": nonce,
    }
    return signed.signature.hex(), auth


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=BASE)
    ap.add_argument("--ask", required=True)
    ap.add_argument("--body", required=True)
    ap.add_argument("--wallet", default="/root/.veyctum-phase1-wallet.json")
    ap.add_argument("--outdir", default="out")
    ap.add_argument("--tag", default="probe")
    args = ap.parse_args()

    body = json.loads(args.body)
    if not os.path.exists(args.wallet):
        sys.exit(f"wallet file missing: {args.wallet}")
    w = json.load(open(args.wallet))
    key = w["private_key"] if w["private_key"].startswith("0x") else "0x" + w["private_key"]
    acct = Account.from_key(key)
    print(f"[0] payer: {acct.address}")

    chall, raw_402 = get_challenge(args.base, args.ask, body)
    req = pick_evm(chall)
    print(f"[2] challenge: pay {req['amount']} ({req['asset']}) to {req['payTo']} on {req['network']}")

    sig, auth = sign_auth(key, acct, req)
    payload = {
        "x402Version": 2,
        "resource": chall.get("resource"),
        "accepted": req,
        "payload": {"signature": "0x" + sig, "authorization": auth},
        "extensions": {},
    }
    header = base64.b64encode(json.dumps(payload).encode()).decode()
    print("[3] signed eip3009 auth, retrying with PAYMENT-SIGNATURE")
    status, headers, resp = http("POST", args.base + args.ask, body,
                                 headers={"PAYMENT-SIGNATURE": header})
    print(f"[4] paid request: {status}")
    settle = headers.get("Payment-Response", "")
    print(f"[5] PAYMENT-RESPONSE header: {settle[:120]}")
    parsed = None
    try:
        parsed = json.loads(resp)
        print(json.dumps(parsed, indent=2)[:3000])
    except Exception:
        print(resp[:2000])

    os.makedirs(args.outdir, exist_ok=True)
    stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    tag = args.tag + "_" + stamp
    json.dump(body, open(f"{args.outdir}/{tag}_request.json", "w"), indent=2)
    json.dump(chall, open(f"{args.outdir}/{tag}_challenge.json", "w"), indent=2)
    json.dump(payload, open(f"{args.outdir}/{tag}_paymentpayload.json", "w"), indent=2)
    json.dump({"status": status, "settlement": settle, "headers": {k: v for k, v in headers.items() if k.lower().startswith("x-payment") or k.lower() == "payment-response"}},
              open(f"{args.outdir}/{tag}_meta.json", "w"), indent=2)
    with open(f"{args.outdir}/{tag}_response.json", "w") as f:
        f.write(resp)
    print(f"[6] artifacts saved to {args.outdir}/{tag}_*.json")
    if status == 200 and parsed and parsed.get("signal_hash"):
        sig_hash = parsed["signal_hash"]
        print(f"SIGNAL_HASH={sig_hash}")
        if sig_hash:
            s, h, r = http("GET", f"{args.base}/engine/v1/signal/{sig_hash}")
            print(f"[7] signal lookup: {s}")
            print(r[:2000])
            with open(f"{args.outdir}/{tag}_signal.json", "w") as f:
                f.write(r)


if __name__ == "__main__":
    main()