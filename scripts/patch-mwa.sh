#!/bin/bash
# Patch @solana-mobile/mobile-wallet-adapter-protocol to use .get() instead of
# .getEnforcing() so the app doesn't crash in Expo Go or on non-Solana phones.
FILE="node_modules/@solana-mobile/mobile-wallet-adapter-protocol/lib/cjs/index.native.js"
if [ -f "$FILE" ]; then
  sed -i.bak 's/TurboModuleRegistry\.getEnforcing("SolanaMobileWalletAdapter")/TurboModuleRegistry.get("SolanaMobileWalletAdapter")/' "$FILE"
  rm -f "${FILE}.bak"
  echo "✓ Patched MWA protocol for Expo Go compatibility"
fi

# Also patch the ESM version
ESM_FILE="node_modules/@solana-mobile/mobile-wallet-adapter-protocol/lib/esm/index.native.js"
if [ -f "$ESM_FILE" ]; then
  sed -i.bak 's/TurboModuleRegistry\.getEnforcing("SolanaMobileWalletAdapter")/TurboModuleRegistry.get("SolanaMobileWalletAdapter")/' "$ESM_FILE"
  rm -f "${ESM_FILE}.bak"
fi
