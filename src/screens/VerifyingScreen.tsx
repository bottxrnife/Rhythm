import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components';
import { useSafeWallet } from '../services/wallet';
import { verifyRoutine } from '../services/verification';
import { colors, typography, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

// Hard cap — after this, we show the user a retry/cancel UI instead of spinning forever.
const VERIFICATION_TIMEOUT_MS = 45000;

export function VerifyingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Verifying'>>();
  const { routine, videoUri } = route.params;
  const location = route.params.location;
  const { account } = useSafeWallet();
  const [step, setStep] = useState(0); // 0=capture, 1=verify, 2=policy, 3=payout
  const [status, setStatus] = useState<'running' | 'timedOut'>('running');
  const [runToken, setRunToken] = useState(0); // bump to re-trigger verification
  const pulse = useRef(new Animated.Value(0)).current;

  // Gentle breathing pulse on the spinner icon — subtle, native-driven.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    let cancelled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      setStep(1); // Verification agent
      setStatus('running');

      timeoutHandle = setTimeout(() => {
        if (cancelled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        setStatus('timedOut');
      }, VERIFICATION_TIMEOUT_MS);

      try {
        const result = await verifyRoutine({
          routineId: routine.id,
          sponsorName: routine.sponsorName ?? 'none',
          videoUri,
          location,
          walletAddress: account?.address?.toString(),
        });

        if (cancelled) return;
        if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }

        setStep(2); // Policy agent
        await new Promise((r) => setTimeout(r, 300));
        if (cancelled) return;
        setStep(3); // Payout agent
        await new Promise((r) => setTimeout(r, 300));
        if (cancelled) return;

        if (result.verified) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          navigation.replace('Verified', { routine, credits: routine.credits, videoUri, location });
        } else {
          navigation.replace('Almost', { routine, videoUri, shortReason: result.shortReason });
        }
      } catch (e: any) {
        if (cancelled) return;
        if (timeoutHandle) { clearTimeout(timeoutHandle); timeoutHandle = null; }
        console.warn('Verification error:', e?.message);
        navigation.replace('Almost', {
          routine,
          videoUri,
          shortReason: 'could not reach verification server',
        });
      }
    };

    run();
    return () => {
      cancelled = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  // Re-run whenever runToken bumps (from retry button).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken]);

  const retry = () => setRunToken((t) => t + 1);
  const cancel = () => {
    navigation.replace('Almost', {
      routine,
      videoUri,
      shortReason: 'verification took too long',
    });
  };

  if (status === 'timedOut') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={[styles.iconWrap, { borderColor: colors.error }]}>
            <MaterialIcons name="hourglass-empty" size={48} color={colors.error} />
          </View>
          <View style={styles.textBlock}>
            <Text style={[typography.headlineLg, { color: colors.onSurface, textAlign: 'center' }]}>
              This is taking longer than expected.
            </Text>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              The verification server may be slow right now. You can try again in a moment, or go back and review your capture.
            </Text>
          </View>
          <View style={styles.retryActions}>
            <Button
              label="Try again"
              onPress={retry}
              icon={<MaterialIcons name="refresh" size={18} color={colors.onPrimary} />}
            />
            <Button label="Go back" variant="secondary" onPress={cancel} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Animated.View
          style={[styles.iconWrap, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
        >
          <MaterialIcons name="auto-awesome" size={48} color={colors.primary} />
        </Animated.View>

        <View style={styles.textBlock}>
          <Text style={[typography.headlineLg, { color: colors.onSurface, textAlign: 'center' }]}>
            Verifying your routine...
          </Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            Amazon Nova 2 Lite is reviewing your capture for "{routine.title}". This usually takes just a moment.
          </Text>
        </View>

        <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />

        <View style={styles.steps}>
          <StepIndicator label="Capture agent" done={step >= 1} />
          <StepIndicator label="Verification agent (Nova 2 Lite)" done={step >= 2} active={step === 1} />
          <StepIndicator label="Policy agent" done={step >= 3} active={step === 2} />
          <StepIndicator label="Payout agent (x402)" active={step === 3} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function StepIndicator({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <View style={stepStyles.row} accessibilityRole="text">
      <View style={[stepStyles.dot, done && stepStyles.dotDone, active && stepStyles.dotActive]}>
        {done && <MaterialIcons name="check" size={12} color={colors.onPrimary} />}
      </View>
      <Text
        style={[
          typography.labelSm,
          {
            color: done ? colors.primary : active ? colors.onSurface : colors.outlineVariant,
          },
        ]}
      >
        {label}
      </Text>
    </View>
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
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.stackSm,
    maxWidth: 320,
  },
  spinner: {
    marginVertical: spacing.stackSm,
  },
  steps: {
    gap: spacing.stackMd,
    alignItems: 'flex-start',
  },
  retryActions: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.stackSm,
    marginTop: spacing.stackMd,
  },
});

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.primary,
  },
  dotActive: {
    backgroundColor: colors.primaryFixedDim,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
