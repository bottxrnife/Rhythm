import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components';
import { useAppState } from '../state/AppState';
import { colors, typography, spacing, shadows } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { SOLANA_CLUSTER, SOLANA_WALLET_CHAIN } from '../config/solana';

export function VerifiedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Verified'>>();
  const { routine, credits } = route.params;
  const videoUri = route.params.videoUri;
  const location = route.params.location;
  const { addCompletion } = useAppState();
  const [txSignature, setTxSignature] = useState<string | undefined>();
  const [txError, setTxError] = useState<string | undefined>();

  // Celebration animations — checkmark pop in and reward card fade up.
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const rewardTranslateY = useRef(new Animated.Value(20)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fire a success haptic on mount
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 180,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(rewardTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rewardOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [checkScale, checkOpacity, rewardTranslateY, rewardOpacity]);

  useEffect(() => {
    let cancelled = false;

    const recordOnChain = async () => {
      let sig: string | undefined;

      try {
        const { transact } = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
        const { Transaction, TransactionInstruction, PublicKey, clusterApiUrl } = require('@solana/web3.js');
        const { TextEncoder } = require('text-encoding');

        const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
        const APP_IDENTITY = { name: 'Rhythm', uri: 'https://rhythm.app', icon: 'favicon.png' };

        const memo = JSON.stringify({
          app: 'rhythm',
          routine: routine.id,
          sponsor: routine.sponsorName ?? 'none',
          credits,
          ts: Date.now(),
          loc: location
            ? `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`
            : undefined,
        });

        // Use transact to open a wallet session — the wallet handles RPC
        sig = await transact(async (wallet: any) => {
          const auth = await wallet.authorize({
            chain: SOLANA_WALLET_CHAIN,
            identity: APP_IDENTITY,
          });

          // Decode address — MWA may return base64. `PublicKey` comes from a
          // `require()` above, so its *type* isn't directly accessible; use any.
          let userPubkey: any;
          try {
            userPubkey = new PublicKey(auth.accounts[0].address);
          } catch {
            const bytes = Uint8Array.from(atob(auth.accounts[0].address), c => c.charCodeAt(0));
            userPubkey = new PublicKey(bytes);
          }

          // Fetch blockhash with raw fetch to avoid @solana/web3.js crypto dependency
          const rpcResponse = await fetch(clusterApiUrl(SOLANA_CLUSTER), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getLatestBlockhash',
              params: [{ commitment: 'confirmed' }],
            }),
          });
          const { result } = await rpcResponse.json();
          const blockhash = result.value.blockhash;

          const memoProgramTx = new Transaction({
            recentBlockhash: blockhash,
            feePayer: userPubkey,
          }).add(
            new TransactionInstruction({
              data: new TextEncoder().encode(memo) as Buffer,
              keys: [],
              programId: MEMO_PROGRAM_ID,
            }),
          );

          const signatures = await wallet.signAndSendTransactions({
            transactions: [memoProgramTx],
          });

          return signatures[0];
        });

        if (!cancelled && sig) setTxSignature(sig);
      } catch (e: any) {
        if (!cancelled) setTxError(e?.message ?? 'Transaction failed');
      }

      if (!cancelled) {
        addCompletion({
          task: routine.title,
          timestamp: Date.now(),
          icon: routine.icon,
          credits,
          sponsor: routine.sponsorName ?? 'Rhythm',
          routineId: routine.id,
          videoUri,
          location,
          txSignature: typeof sig === 'string' ? sig : undefined,
        });
      }
    };

    recordOnChain();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
    );
  };

  const goRewards = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'Rewards' } }],
      })
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Checkmark */}
        <Animated.View
          style={[
            styles.checkCircle,
            { transform: [{ scale: checkScale }], opacity: checkOpacity },
          ]}
        >
          <View style={styles.checkInner} />
          <MaterialIcons name="check-circle" size={64} color={colors.primary} />
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textBlock, { opacity: rewardOpacity }]}>
          <Text style={[typography.display, { color: colors.onSurface }]}>Well done.</Text>
          <Text style={[typography.headlineMd, { color: colors.onSurfaceVariant }]}>
            Routine verified.
          </Text>
        </Animated.View>

        {/* Reward Card */}
        <Animated.View
          style={[
            styles.rewardCard,
            shadows.soft,
            { opacity: rewardOpacity, transform: [{ translateY: rewardTranslateY }] },
          ]}
        >
          <MaterialIcons name="stars" size={32} color={colors.tertiary} />
          <View style={styles.rewardRow}>
            <Text style={[typography.display, { color: colors.tertiary }]}>{credits}</Text>
            <Text style={[typography.labelLg, { color: colors.tertiaryContainer }]}>Credits</Text>
          </View>
          <View style={styles.rewardDivider} />
        </Animated.View>

        {/* Encouragement */}
        <Text style={[typography.bodyLg, styles.encouragement]}>
          {routine.title} complete. You're building a great rhythm today.
        </Text>

        {/* On-chain status */}
        {txSignature && (
          <View style={styles.txRow}>
            <MaterialIcons name="link" size={16} color={colors.primary} />
            <Text style={[typography.labelSm, { color: colors.primary }]}>
              Recorded on Solana
            </Text>
          </View>
        )}
        {txError && (
          <View style={styles.txRow}>
            <MaterialIcons name="info-outline" size={16} color={colors.outline} />
            <Text style={[typography.labelSm, { color: colors.outline }]}>
              {txError}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button label="Return to Home" onPress={goHome} />
          <Button label="View Earnings" variant="secondary" onPress={goRewards} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.marginPage,
    gap: spacing.stackLg,
  },
  checkCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    ...shadows.diffuse,
  },
  checkInner: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(187,203,185,0.5)',
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  rewardCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: spacing.stackSm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  rewardDivider: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.tertiaryFixed,
    marginTop: 8,
  },
  encouragement: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.stackMd,
  },
});
