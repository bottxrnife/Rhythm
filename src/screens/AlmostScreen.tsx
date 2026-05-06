import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
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
  const { routine, videoUri } = route.params;
  const { addCompletion } = useAppState();

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

      <View style={styles.content}>
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
          <Text style={[typography.bodyLg, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            Our AI model, Amazon Nova 2 Lite, couldn't quite verify "{routine.title}" clearly. This happens
            sometimes with reflections or low lighting.
          </Text>
        </View>

        {/* Recovery Actions */}
        <View style={styles.actions}>
          <Button
            label="Try again with better light"
            onPress={() => navigation.replace('Capture', { routine })}
            icon={<MaterialIcons name="photo-camera" size={20} color={colors.onPrimary} />}
            style={styles.retryBtn}
          />
          <Button
            label="Self-verify (no reward)"
            variant="secondary"
            onPress={selfVerify}
            icon={<MaterialIcons name="check-circle" size={20} color={colors.primary} />}
          />
        </View>
      </View>
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
  actions: {
    width: '100%',
    gap: spacing.stackMd,
    marginTop: 'auto',
  },
  retryBtn: {
    backgroundColor: colors.primaryContainer,
  },
});
