import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Location from 'expo-location';
import { colors, typography, spacing } from '../theme';
import { Button } from '../components';
import type { RootStackParamList } from '../navigation/types';

type Phase = 'camera' | 'review';

const MAX_DURATION_SECONDS = 30;
// When the user crosses this many seconds we tint the counter to warn them
// that the hard cap is approaching. They can still stop at any point.
const WARNING_THRESHOLD_SECONDS = 24;

export function CaptureScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Capture'>>();
  const { routine } = route.params;

  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [phase, setPhase] = useState<Phase>('camera');
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [captureLocation, setCaptureLocation] = useState<
    { latitude: number; longitude: number } | undefined
  >();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  // Synchronous tracker for "is recording right now". React state lags a frame,
  // so using the state alone causes a race where the stop button is a no-op
  // while recordAsync is still being invoked asynchronously.
  const recordingRef = useRef(false);

  // Lifecycle cleanup — clear timer and stop any in-flight recording on unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recordingRef.current && cameraRef.current) {
        try {
          cameraRef.current.stopRecording();
        } catch {
          // no-op
        }
      }
      recordingRef.current = false;
    };
  }, []);

  // -- Timer for recording duration --
  const startTimer = useCallback(() => {
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Display "12/30s" while recording so the user can feel the budget.
  const formatElapsedWithLimit = (secs: number) => {
    const clamped = Math.min(secs, MAX_DURATION_SECONDS);
    return `${clamped}/${MAX_DURATION_SECONDS}s`;
  };

  // GPS is optional and may take several seconds. It MUST NOT block recording
  // start — otherwise tapping "stop" on the UI acts on a camera that hasn't
  // started yet and the recording can't be interrupted until maxDuration.
  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!mountedRef.current) return;
      setCaptureLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      // GPS is optional — missing location is fine for non-medication routines.
    }
  }, []);

  // -- Recording --
  const startRecording = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || recordingRef.current) return;

    // Flip both trackers immediately so the stop button becomes live the moment
    // recordAsync kicks off.
    recordingRef.current = true;
    setRecording(true);
    startTimer();

    // Fire off location fetch in parallel — deliberately not awaited.
    fetchLocation();

    try {
      // recordAsync resolves when the recording ENDS (via stopRecording or
      // maxDuration). It starts the native recorder synchronously when called.
      //
      // We intentionally record at the device-native high quality — the user
      // sees a smooth preview and a crisp clip on the review screen. The
      // verification server downsamples to 15fps / 480p before sending to
      // Nova, so uploading from the phone stays fast without sacrificing
      // on-device visual quality.
      const result = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_SECONDS,
      });
      if (!mountedRef.current) return;
      if (result?.uri) {
        setVideoUri(result.uri);
        setPhase('review');
      }
    } catch {
      // Recording was stopped or errored — nothing to surface.
    } finally {
      recordingRef.current = false;
      if (mountedRef.current) {
        setRecording(false);
        stopTimer();
      }
    }
  }, [cameraReady, startTimer, stopTimer, fetchLocation]);

  const stopRecording = useCallback(() => {
    if (!recordingRef.current || !cameraRef.current) return;
    try {
      cameraRef.current.stopRecording();
    } catch {
      // The recordAsync promise will still settle and drive the UI forward.
    }
  }, []);

  const handleCapturePress = useCallback(() => {
    // Use the synchronous ref so the very first tap after starting always
    // takes the correct branch even if React hasn't flushed the setRecording
    // state update yet.
    if (recordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [startRecording, stopRecording]);

  const handleRetake = useCallback(() => {
    setVideoUri(null);
    setPhase('camera');
    setElapsed(0);
    // CameraView unmounted during the review phase. When we re-enter camera
    // phase a fresh instance mounts and will fire onCameraReady again. Reset
    // the flag so we actually wait for that signal instead of acting on the
    // stale "ready" state from the previous session.
    setCameraReady(false);
  }, []);

  const handleSubmit = useCallback(() => {
    navigation.replace('Verifying', {
      routine,
      videoUri: videoUri ?? undefined,
      location: captureLocation,
    });
  }, [navigation, routine, videoUri, captureLocation]);

  // -- Permissions --
  if (!cameraPermission || !micPermission) {
    return <View style={styles.safe} />;
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.permissionScreen}>
          <View style={styles.permissionIcon}>
            <MaterialIcons name="videocam" size={48} color={colors.primary} />
          </View>
          <Text style={[typography.headlineLg, { color: colors.onSurface, textAlign: 'center' }]}>
            Camera & microphone access
          </Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: 280 }]}>
            Rhythm needs your camera and microphone to record a short clip of your routine.
            The video stays on your device until you submit it.
          </Text>
          <Button
            label="Allow Camera Access"
            onPress={async () => {
              await requestCameraPermission();
              await requestMicPermission();
            }}
          />
          <Button
            label="Go Back"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // -- Review phase: show recorded video --
  if (phase === 'review' && videoUri) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ReviewPhase
          videoUri={videoUri}
          routineTitle={routine.title}
          onRetake={handleRetake}
          onSubmit={handleSubmit}
        />
      </SafeAreaView>
    );
  }

  // -- Camera phase: live viewfinder --
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.viewfinder}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="video"
          onCameraReady={() => setCameraReady(true)}
        />

        {/* Top Controls */}
        <View style={styles.topControls}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.overlayBtn, pressed && styles.overlayBtnPressed]}
            accessibilityLabel="Close camera"
            accessibilityRole="button"
            hitSlop={8}
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </Pressable>

          {recording && (
            <View
              style={[
                styles.recBadge,
                elapsed >= WARNING_THRESHOLD_SECONDS && styles.recBadgeWarning,
              ]}
              accessibilityLabel={`Recording ${elapsed} of ${MAX_DURATION_SECONDS} seconds`}
              accessibilityLiveRegion="polite"
            >
              <View style={styles.recDot} />
              <Text style={[typography.labelLg, { color: '#fff' }]}>
                {formatElapsedWithLimit(elapsed)}
              </Text>
            </View>
          )}

          {!recording && (
            <Pressable
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              style={({ pressed }) => [styles.overlayBtn, pressed && styles.overlayBtnPressed]}
              accessibilityLabel="Flip camera"
              accessibilityRole="button"
              hitSlop={8}
            >
              <MaterialIcons name="flip-camera-ios" size={24} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* Task Info Overlay */}
        <View style={styles.taskOverlay}>
          <View style={styles.taskChip}>
            <MaterialIcons name={routine.icon as any} size={16} color={colors.primary} />
            <Text style={[typography.labelLg, { color: colors.onSurface }]}>
              {routine.title}
            </Text>
          </View>
          <Text style={[typography.labelSm, { color: 'rgba(255,255,255,0.8)' }]}>
            {routine.steps[routine.steps.length - 1]}
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <View style={styles.controlSpacer} />

        <Pressable
          onPress={handleCapturePress}
          style={({ pressed }) => [
            styles.captureBtn,
            recording && styles.captureBtnRec,
            pressed && styles.captureBtnPressed,
          ]}
          accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
          accessibilityRole="button"
          accessibilityState={{ busy: recording }}
          disabled={!cameraReady}
        >
          <View style={[styles.captureInner, recording && styles.captureInnerRec]} />
        </Pressable>

        <View style={styles.controlSpacer} />
      </View>

      <View style={styles.hintBar}>
        <Text style={[typography.labelSm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
          {!cameraReady
            ? 'Preparing camera...'
            : recording
            ? `Perform the routine, then tap to stop · up to ${MAX_DURATION_SECONDS}s`
            : `Tap to start recording · up to ${MAX_DURATION_SECONDS}s`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// -- Review sub-component --

function ReviewPhase({
  videoUri,
  routineTitle,
  onRetake,
  onSubmit,
}: {
  videoUri: string;
  routineTitle: string;
  onRetake: () => void;
  onSubmit: () => void;
}) {
  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
    p.play();
  });
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    // Give the UI a beat to show the spinner before navigating, so the
    // user gets immediate feedback that their tap was received.
    setTimeout(() => onSubmit(), 50);
  };

  return (
    <View style={styles.reviewContainer}>
      <View style={styles.reviewVideo}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls={false}
          contentFit="cover"
        />
      </View>

      <View style={styles.reviewContent}>
        <Text style={[typography.headlineMd, { color: colors.onSurface }]}>
          Review your clip
        </Text>
        <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
          Does this capture show you completing "{routineTitle}"? If it looks
          good, submit it for verification.
        </Text>

        <View style={styles.reviewActions}>
          <Button label="Submit for Verification" onPress={handleSubmit} loading={submitting} />
          <Button
            label="Retake"
            variant="secondary"
            onPress={onRetake}
            disabled={submitting}
            icon={<MaterialIcons name="replay" size={18} color={colors.primary} />}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  // -- Permission screen --
  permissionScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.marginPage,
    gap: spacing.stackLg,
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -- Camera phase --
  viewfinder: {
    flex: 1,
    borderRadius: 24,
    margin: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 8 : 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    opacity: 0.9,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(186,26,26,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
  },
  recBadgeWarning: {
    // Tint brighter red when the hard cap is within ~6 seconds so the user
    // knows recording will auto-stop shortly.
    backgroundColor: 'rgba(224,58,48,0.95)',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  taskOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  taskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },

  // -- Bottom controls --
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: spacing.marginPage,
  },
  controlSpacer: { flex: 1 },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnRec: {
    borderColor: colors.error,
  },
  captureBtnPressed: {
    transform: [{ scale: 0.94 }],
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  captureInnerRec: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.error,
  },
  hintBar: {
    paddingHorizontal: spacing.marginPage,
    paddingBottom: 8,
  },

  // -- Review phase --
  reviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  reviewVideo: {
    flex: 1,
    borderRadius: 24,
    margin: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  reviewContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.marginPage,
    paddingBottom: 32,
    gap: spacing.stackMd,
  },
  reviewActions: {
    gap: spacing.stackSm,
    marginTop: spacing.stackSm,
  },
});
