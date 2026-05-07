import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackHeader, Button } from '../components';
import { useAppState } from '../state/AppState';
import { colors, typography, spacing, shadows } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const ATTEMPT_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCnCc6fTzFj6G4errUpiqKlVHstWDuvzPiIgH6mUQm-XRYmvVYKgXzi8XHCIv5kkpQ44ygm4DgJ2MHHubub0gqdLCFu8aLSWmZ7D2wztWuKirMnG4funiCAK2Ht1VA1-hYCF9o-Wa6Of8s8WnfL19bJHEZkvYQgDSvNIqIfCQKPYedLOo8HsjhCcOboNS2gDFg3VYSVZHRUjLln17-hdCkVaxTmIHcS3CBiPYQ3Vrg7T3YRDNHfsqvBmqg1CuSze16raoI2wEEWHjkT';

export function AlmostScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Almost'>>();
  const { routine, videoUri, shortReason } = route.params;
  const { addCompletion } = useAppState();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, translateY]);

  // Format the reason for display.
  const reasonText = (() => {
    const raw = (shortReason ?? '').trim();
    if (!raw) return 'Could not clearly verify the routine';
    const cleaned = raw.charAt(0).toUpperCase() + raw.slice(1);
    return cleaned.replace(/\.$/, '');
  })();

  const selfVerify = () => {
    addCompletion({
      task: routine.title,
      timestamp: Date.now(),
      icon: routine.icon,
      credits: '+0.00',
      sponsor: routine.sponsorName ?? 'Rhythm',
      routineId: routine.id,
      videoUri,
      selfVerified: true,
    });

    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BackHeader />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeIn, transform: [{ translateY }] },
        ]}
      >
        {/* Hero Image with Focus Overlay */}
        <View style={[styles.imageWrap, shadows.diffuse]}>
          <Image source={{ uri: ATTEMPT_URI }} style={styles.image} blurRadius={2} />
          <View style={styles.focusOverlay}>
            <MaterialIcons name="center-focus-weak" size={48} color="rgba(94,109,94,0.5)" />
          </View>
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={[typography.display, { color: colors.onSurface }]}>
            We almost got it.
          </Text>

          {/* Reason badge — what Nova 2 Lite flagged */}
          <View style={styles.reasonCard}>
            <MaterialIcons name="info-outline" size={18} color={colors.secondary} />
            <Text style={[typography.labelLg, styles.reasonText]} numberOfLines={3}>
              {reasonText}
            </Text>
          </View>

          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            Try recording again with the hint above in mind, or self-verify without a reward.
          </Text>
        </View>

        {/* Recovery Actions */}
        <View style={styles.actions}>
          <Button
            label="Try again"
            onPress={() => navigation.replace('Capture', { routine })}
            icon={<MaterialIcons name="photo-camera" size={20} color={colors.onPrimary} />}
          />
          <Button
            label="Self-verify (no reward)"
            variant="secondary"
            onPress={selfVerify}
            icon={<MaterialIcons name="check-circle" size={20} color={colors.primary} />}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.marginPage,
    gap: spacing.stackLg,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxHeight: 320,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLowest,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.9,
  },
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    backgroundColor: colors.secondaryContainer,
    paddingVertical: spacing.stackSm + 2,
    paddingHorizontal: spacing.stackMd,
    borderRadius: 999,
    maxWidth: '100%',
    marginTop: spacing.unit,
  },
  reasonText: {
    color: colors.onSecondaryContainer,
    flexShrink: 1,
  },
  actions: {
    width: '100%',
    gap: spacing.stackMd,
    marginTop: 'auto',
  },
});
