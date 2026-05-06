// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 37.7749, longitude: -122.4194 },
  }),
  Accuracy: { Balanced: 3 },
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
  useMicrophonePermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

// Mock expo-video
jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({ play: jest.fn(), loop: false })),
  VideoView: 'VideoView',
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock @wallet-ui/react-native-web3js
jest.mock('@wallet-ui/react-native-web3js', () => ({
  useMobileWallet: jest.fn(() => ({
    account: { address: 'TestWalletAddress123', label: 'test.skr' },
    signIn: jest.fn(),
    disconnect: jest.fn(),
  })),
  MobileWalletProvider: ({ children }) => children,
}));

// Mock @solana-mobile/mobile-wallet-adapter-protocol-web3js
jest.mock('@solana-mobile/mobile-wallet-adapter-protocol-web3js', () => ({
  transact: jest.fn(),
}));

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation((key) => ({ toString: () => key })),
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnThis(),
  })),
  TransactionInstruction: jest.fn(),
  clusterApiUrl: jest.fn(() => 'https://api.devnet.solana.com'),
}));

// Mock react-native-quick-crypto
jest.mock('react-native-quick-crypto', () => ({
  install: jest.fn(),
}));

// Silence console.warn in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Verification error')) return;
  if (typeof args[0] === 'string' && args[0].includes('SKR lookup')) return;
  originalWarn(...args);
};
