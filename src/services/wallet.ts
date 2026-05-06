/**
 * Safe wallet hook that gracefully handles missing native modules.
 *
 * On Solana Seeker (native build with MWA): uses the real MobileWalletProvider.
 * On standard Android / Expo Go: returns a no-op fallback.
 */
import { TurboModuleRegistry } from 'react-native';

// Check once at module load whether the native MWA module exists
const hasMWA = TurboModuleRegistry.get('SolanaMobileWalletAdapter') != null;

export type WalletAccount = {
  address: { toString(): string };
  label?: string;
} | null;

export type WalletState = {
  account: WalletAccount;
  signIn: (params: any) => Promise<any>;
  disconnect: () => Promise<void>;
  isAvailable: boolean;
};

const fallback: WalletState = {
  account: null,
  signIn: async () => {
    throw new Error('Native wallet adapter not available');
  },
  disconnect: async () => {},
  isAvailable: false,
};

export function useSafeWallet(): WalletState {
  if (!hasMWA) {
    return fallback;
  }

  try {
    const { useMobileWallet } = require('@wallet-ui/react-native-web3js');
    const wallet = useMobileWallet();
    return { ...wallet, isAvailable: true };
  } catch {
    return fallback;
  }
}
