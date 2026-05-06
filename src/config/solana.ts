export type SolanaCluster = 'devnet' | 'mainnet-beta';

function getCluster(): SolanaCluster {
  const raw = process.env.EXPO_PUBLIC_SOLANA_CLUSTER;
  if (raw === 'mainnet-beta') return 'mainnet-beta';
  return 'devnet';
}

export const SOLANA_CLUSTER: SolanaCluster = getCluster();

// Wallet Adapter chain (CAIP-2-ish). Keep this aligned with SOLANA_CLUSTER.
export const SOLANA_WALLET_CHAIN: 'solana:devnet' | 'solana:mainnet' =
  SOLANA_CLUSTER === 'mainnet-beta' ? 'solana:mainnet' : 'solana:devnet';

export const SOLANA_EXPLORER_CLUSTER_PARAM: 'devnet' | 'mainnet-beta' =
  SOLANA_CLUSTER === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';

export const SOLANA_RPC_URL: string =
  SOLANA_CLUSTER === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';

