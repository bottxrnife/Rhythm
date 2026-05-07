import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileWalletProvider } from '@wallet-ui/react-native-web3js';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation';
import { AppStateProvider } from './src/state/AppState';
import { ErrorBoundary } from './src/components';
import { colors } from './src/theme';
import { SOLANA_WALLET_CHAIN, SOLANA_RPC_URL } from './src/config/solana';

const APP_IDENTITY = {
  name: 'Rhythm',
  uri: 'https://rhythm.app',
  icon: 'favicon.png',
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <MobileWalletProvider
        chain={SOLANA_WALLET_CHAIN}
        endpoint={SOLANA_RPC_URL}
        identity={APP_IDENTITY}
      >
        <AppStateProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </ErrorBoundary>
        </AppStateProvider>
      </MobileWalletProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
