import { mainnet, base, arbitrum, optimism, polygon, type Chain } from 'viem/chains';

/**
 * Multi-chain registry. Veyctum auto-detects which chain a transaction lives on
 * (the Engine only passes us a tx_hash, and the legacy YAML advertised base-only,
 * so the chain hint cannot be trusted). Each chain keeps an independent primary +
 * fallback RPC pair so no single provider can support a verification claim.
 */
export interface ChainDef {
  id: number;
  name: string;
  viemChain: Chain;
  rpcPrimary: string;
  rpcFallback: string;
  /** Native currency symbol used in the human-readable answer summary. */
  nativeSymbol: string;
}

type ChainDefaults = Omit<ChainDef, 'rpcPrimary' | 'rpcFallback'> & {
  rpcPrimary: string;
  rpcFallback: string;
};

/** Built-in defaults; every RPC URL is overridable via RPC_<NAME>_PRIMARY/FALLBACK. */
const DEFAULTS: Record<string, ChainDefaults> = {
  ethereum: {
    id: 1,
    name: 'ethereum',
    viemChain: mainnet,
    nativeSymbol: 'ETH',
    // drpc + publicnode verified reachable from the deployment host (llamarpc/
    // publicnode-rpc are blocked here, per DEC-003 host notes).
    rpcPrimary: 'https://eth.drpc.org',
    rpcFallback: 'https://ethereum.publicnode.com',
  },
  base: {
    id: 8453,
    name: 'base',
    viemChain: base,
    nativeSymbol: 'ETH',
    // Verified working for all methods incl. receipts (DEC-003).
    rpcPrimary: 'https://mainnet.base.org',
    rpcFallback: 'https://base.drpc.org',
  },
  arbitrum: {
    id: 42161,
    name: 'arbitrum',
    viemChain: arbitrum,
    nativeSymbol: 'ETH',
    rpcPrimary: 'https://arbitrum.drpc.org',
    rpcFallback: 'https://arb1.arbitrum.io/rpc',
  },
  optimism: {
    id: 10,
    name: 'optimism',
    viemChain: optimism,
    nativeSymbol: 'ETH',
    rpcPrimary: 'https://optimism.drpc.org',
    rpcFallback: 'https://mainnet.optimism.io',
  },
  polygon: {
    id: 137,
    name: 'polygon',
    viemChain: polygon,
    nativeSymbol: 'POL',
    rpcPrimary: 'https://polygon.drpc.org',
    rpcFallback: 'https://polygon-rpc.com',
  },
};

/** Chain names Veyctum knows how to build (for input validation). */
export const KNOWN_CHAINS = Object.keys(DEFAULTS) as [string, ...string[]];

/**
 * Resolve the enabled chains from a comma list, honoring per-chain RPC overrides
 * from the environment. Throws on an unknown chain name so misconfig fails fast.
 */
export function buildEnabledChains(
  enabled: string[],
  env: NodeJS.ProcessEnv = process.env,
): ChainDef[] {
  const out: ChainDef[] = [];
  const seen = new Set<string>();
  for (const raw of enabled) {
    const name = raw.trim().toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const def = DEFAULTS[name];
    if (!def) {
      throw new Error(`unknown chain '${name}' in ENABLED_CHAINS (known: ${KNOWN_CHAINS.join(', ')})`);
    }
    const upper = name.toUpperCase();
    out.push({
      ...def,
      rpcPrimary: env[`RPC_${upper}_PRIMARY`] || def.rpcPrimary,
      rpcFallback: env[`RPC_${upper}_FALLBACK`] || def.rpcFallback,
    });
  }
  if (out.length === 0) throw new Error('ENABLED_CHAINS resolved to no chains');
  return out;
}
