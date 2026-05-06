import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeWallet } from '../services/wallet';
import { verifyRoutine } from '../services/verification';
import { colors, typography, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export function VerifyingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Verifying'>>();
  const { routine, videoUri } = route.params;
  const location = route.params.location;
  const { account } = useSafeWallet();
  const [step, setStep] = useState(0); // 0=capture, 1=verify, 2=policy, 3=payout

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStep(1); // Verification agent

      try {
        const result = await verifyRoutine({
          routineId: routine.id,
          sponsorName: routine.sponsorName ?? 'none',
          videoUri,
          location,
          walletAddress: account?.address?.toString(),
        });

        if (cancelled) return;
        setStep(2); // Policy agent
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;
        setStep(3); // Payout agent
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;

        if (result.verified) {
          navigation.replace('Verified', { routine, credits: routine.credits, videoUri, location });
        } else {
          navigation.replace('Almost', { routine, videoUri });
        }
      } catch (e: any) {
        if (cancelled) return;
        // API not configured or network error — go to Almost screen
        console.warn('Verification error:', e?.message);
        navigation.replace('Almost', { routine, videoUri });
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="auto-awesome" size={48} color={colors.primary} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[typography.headlineLg, { color: colors.onSurface }]}>
            Verifying your routine...
          </Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            Amazon Nova 2 Lite, our AI verification model, is reviewing your capture for "{routine.title}". This usually takes just a moment.
          </Text>
        </View>

        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />

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
    <View style={stepStyles.row}>
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
    maxWidth: 280,
  },
  spinner: {
    marginVertical: spacing.stackMd,
  },
  steps: {
    gap: spacing.stackMd,
    alignItems: 'flex-start',
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
