import React, { useState } from 'react';
import { View, Text, Image, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeWallet } from '../services/wallet';
import { Button } from '../components';
import { useAppState } from '../state/AppState';
import { colors, typography, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAt7HKHkTWdZda6Nt0cdSURmJkwld71VI3WyB75yDA6TMXTGES9tTSb1VKSAyYOm7m57p7RFyWfMU11PErrFHZ5tbpYFrlwOGlm0odU45BBFAZAcS_MYp5X3Fige91xgUUiuYkSO-K1Gc1PSdnz6aTHbF4ULOjl6POXwvAVH-TFlG3AHZ2Atcg6rke2g0Y7vlN2zEV5NNzTQ4hGWkQ9kOJ44zIqWCoqVdIi52V5l7l7tbJ0Szpf-5F2VW1v3IHUWo0kAmVKbiApjxy1';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

export function WelcomeScreen({ navigation }: Props) {
  const { signIn, isAvailable } = useSafeWallet();
  const { setOnboarded } = useAppState();
  const [connecting, setConnecting] = useState(false);

  const handleSignIn = async () => {
    setConnecting(true);
    try {
      await signIn({
        domain: 'rhythm.app',
        statement: 'Sign in to Rhythm to verify your daily routines and earn rewards.',
      });
      setOnboarded();
      navigation.replace('Main');
    } catch (e: any) {
      if (e?.message === 'Sign in result not retrieved.') {
        // Wallet authorized without SIWS result — continue anyway
        setOnboarded();
        navigation.replace('Main');
        return;
      }
      console.warn('Wallet sign-in failed:', e?.message ?? e);
      Alert.alert(
        'Wallet not found',
        'Please install a Solana wallet app (like Phantom) to continue, or tap "Continue without wallet" to explore the app.',
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleContinueWithoutWallet = () => {
    setOnboarded();
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <Image source={{ uri: HERO_URI }} style={styles.heroImage} />
          <View style={styles.heroGradient} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={[typography.display, styles.heading]}>
            A gentle rhythm for everyday life.
          </Text>
          <Text style={[typography.bodyLg, styles.subtitle]}>
            Verify your daily routines with a short video. Earn rewards from the
            brands you already use.
          </Text>
        </View>

        <View style={styles.actions}>
          {isAvailable ? (
            <Button
              label="Sign In with Solana"
              onPress={handleSignIn}
              style={styles.primaryBtn}
              loading={connecting}
              icon={
                !connecting ? (
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color={colors.onPrimary}
                  />
                ) : undefined
              }
            />
          ) : (
            <Button
              label="Get Started"
              onPress={handleContinueWithoutWallet}
              style={styles.primaryBtn}
              icon={
                <MaterialIcons
                  name="arrow-forward"
                  size={20}
                  color={colors.onPrimary}
                />
              }
            />
          )}
          {isAvailable && (
            <Button
              label="Continue without wallet"
              variant="ghost"
              onPress={handleContinueWithoutWallet}
            />
          )}
        </View>

        <View style={styles.walletNote}>
          <MaterialIcons name="shield" size={16} color={colors.outline} />
          <Text style={[typography.labelSm, { color: colors.outline, flex: 1 }]}>
            {isAvailable
              ? 'Rhythm connects to your Solana wallet on this device. Your keys never leave your wallet app.'
              : 'Wallet features require a native build. You can explore all routines and demo verification without a wallet.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  heroWrap: {
    flex: 1,
    padding: spacing.marginPage,
    paddingBottom: 0,
  },
  heroCard: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    resizeMode: 'cover',
    opacity: 0.9,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackLg,
    paddingBottom: spacing.stackLg,
    gap: spacing.stackLg,
    backgroundColor: colors.background,
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  heading: {
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: {
    gap: spacing.stackSm,
  },
  primaryBtn: {
    borderRadius: 9999,
  },
  walletNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 8,
  },
});
