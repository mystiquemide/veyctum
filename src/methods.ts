import type { Address, Hex } from 'viem';
import type { MethodInfo, TxKind } from './domain.js';

/**
 * Called-method decoding for the ONCHAIN_TX_LOOKUP answer.
 * Local curated 4-byte signatures are checked first (deterministic, zero I/O);
 * an optional bounded 4byte.directory lookup fills gaps. The raw selector is
 * always returned so the answer is verifiable even when the name is unknown.
 */

const LOCAL_SIGNATURES: Record<string, string> = {
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0x2e1a7d4d': 'withdraw(uint256)',
  '0xd0e30db0': 'deposit()',
  '0x3593564c': 'execute(bytes,bytes[],uint256)',
  '0x38ed1739': 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
  '0x7ff36ab5': 'swapExactETHForTokens(uint256,address[],address,uint256)',
  '0x18cbafe5': 'swapExactTokensForETH(uint256,uint256,address[],address,uint256)',
  '0x022c0d9f': 'swap(uint256,uint256,address,bytes)',
  '0xa22cb465': 'setApprovalForAll(address,bool)',
  '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
  '0x40c10f19': 'mint(address,uint256)',
  '0x1249c58b': 'mint()',
  '0x540abf73': 'bridgeERC20To(address,address,uint256,uint32,bytes)',
  '0x32b7006d': 'depositETHTo(address,uint32,bytes)',
  '0xe11013dd': 'depositTo(address)',
};

/** Extract the method name from a full text signature (before the parens). */
export function nameOfSignature(sig: string): string {
  const i = sig.indexOf('(');
  return i >= 0 ? sig.slice(0, i) : sig;
}

/** First 4 bytes of calldata as a 0x-prefixed 8-hex selector, or null. */
export function selectorOf(input: Hex | undefined | null): string | null {
  if (!input) return null;
  const s = input.toLowerCase();
  if (s.length < 10) return null;
  return s.slice(0, 10);
}

/** Classify the transaction shape from calldata + recipient presence. */
export function classifyKind(input: Hex | undefined | null, to: Address | null): TxKind {
  if (to === null) return 'contract_creation';
  const s = (input ?? '0x').toLowerCase();
  if (s === '0x' || s.length <= 2) return 'native_transfer';
  return 'contract_call';
}

const cache = new Map<string, { name: string; signature: string } | null>();

async function fourByte(
  selector: string,
  url: string,
  timeoutMs: number,
): Promise<{ name: string; signature: string } | null> {
  if (cache.has(selector)) return cache.get(selector)!;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}?hex_signature=${selector}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      cache.set(selector, null);
      return null;
    }
    const body = (await res.json()) as { results?: Array<{ id: number; text_signature: string }> };
    // Earliest id is the most likely canonical signature among hash collisions.
    const results = (body.results ?? []).slice().sort((a, b) => a.id - b.id);
    const hit = results[0];
    const value = hit ? { name: nameOfSignature(hit.text_signature), signature: hit.text_signature } : null;
    cache.set(selector, value);
    return value;
  } catch {
    // Transient failure (timeout/network); do not cache so a later call can retry.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface DecodeOpts {
  fourByteEnabled?: boolean;
  fourByteUrl?: string;
  timeoutMs?: number;
}

/**
 * Decode the called method. Never throws: on any failure it returns the raw
 * selector with a null name so the pipeline always produces a verifiable answer.
 */
export async function decodeMethod(
  input: Hex | undefined | null,
  to: Address | null,
  opts: DecodeOpts = {},
): Promise<MethodInfo> {
  const kind = classifyKind(input, to);
  const selector = selectorOf(input);
  if (kind !== 'contract_call' || !selector) {
    return { selector, name: null, signature: null, source: 'none', kind };
  }
  const local = LOCAL_SIGNATURES[selector];
  if (local) {
    return { selector, name: nameOfSignature(local), signature: local, source: 'local', kind };
  }
  if (opts.fourByteEnabled) {
    const fb = await fourByte(
      selector,
      opts.fourByteUrl ?? 'https://www.4byte.directory/api/v1/signatures/',
      opts.timeoutMs ?? 1200,
    );
    if (fb) return { selector, name: fb.name, signature: fb.signature, source: '4byte', kind };
  }
  return { selector, name: null, signature: null, source: 'none', kind };
}
