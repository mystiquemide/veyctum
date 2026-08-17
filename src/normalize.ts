import { decodeEventLog, type Address, type Hex } from 'viem';
import { TRANSFER_TOPIC0, normalizeAddr, normalizeHash } from './domain.js';
import type { TransferEffect } from './domain.js';
import type { TxFacts } from './rpc.js';

const ERC20_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { type: 'address', name: 'from', indexed: true },
      { type: 'address', name: 'to', indexed: true },
      { type: 'uint256', name: 'value', indexed: false },
    ],
  },
] as const;

/**
 * Normalizes Transfer effects for the allowlisted token only (FR-007, FR-008).
 * Token identity is the contract address on the fixed chain, never ticker metadata (BR-003).
 */
export function normalizeEffects(
  facts: TxFacts,
  allowedToken: Address,
): TransferEffect[] {
  const effects: TransferEffect[] = [];
  for (const log of facts.logs) {
    if (log.address.toLowerCase() !== allowedToken.toLowerCase()) continue;
    const topic0 = log.topics[0];
    if (!topic0 || topic0.toLowerCase() !== TRANSFER_TOPIC0) continue;
    let decoded: { from: Address; to: Address; value: bigint };
    try {
      const d = decodeEventLog({
        abi: ERC20_ABI,
        data: log.data,
        topics: log.topics as [signature: Hex, ...args: Hex[]],
      });
      decoded = d.args as { from: Address; to: Address; value: bigint };
    } catch {
      // Malformed Transfer log on the allowlisted token is untrusted; skip it
      // rather than fabricate a semantic fact.
      continue;
    }
    effects.push({
      token: normalizeAddr(log.address),
      sender: normalizeAddr(decoded.from),
      recipient: normalizeAddr(decoded.to),
      raw_amount: decoded.value.toString(),
      log_index: log.logIndex,
      // REV-005: an absent log block hash stays null, never a fake '0x' sentinel.
      block_hash: log.blockHash ? normalizeHash(log.blockHash) : null,
      tx_hash: normalizeHash(log.transactionHash),
    });
  }
  return effects;
}

/**
 * Aggregates identical (token, sender, recipient) effects with checked
 * bigint arithmetic while preserving every individual log (FR-014).
 * Distinct triples produce an AMBIGUOUS state.
 */
export function aggregateEffects(effects: TransferEffect[]): {
  aggregated: Array<{ token: string; sender: string; recipient: string; raw_amount: string; logs: number[] }>;
  ambiguous: boolean;
} {
  const map = new Map<string, { token: string; sender: string; recipient: string; total: bigint; logs: number[] }>();
  for (const e of effects) {
    const key = `${e.token.toLowerCase()}|${e.sender.toLowerCase()}|${e.recipient.toLowerCase()}`;
    const entry = map.get(key);
    if (entry) {
      entry.total += BigInt(e.raw_amount);
      entry.logs.push(e.log_index);
    } else {
      map.set(key, { token: e.token, sender: e.sender, recipient: e.recipient, total: BigInt(e.raw_amount), logs: [e.log_index] });
    }
  }
  const aggregated = [...map.values()].map((m) => ({
    token: m.token,
    sender: m.sender,
    recipient: m.recipient,
    raw_amount: m.total.toString(),
    logs: m.logs,
  }));
  return { aggregated, ambiguous: aggregated.length > 1 };
}

export function topic0Of(log: { topics: Hex[] }): string | undefined {
  return log.topics[0]?.toLowerCase();
}