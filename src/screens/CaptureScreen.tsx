import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  const [captureLocation, setCaptureLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- Timer for recording duration --
  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // -- Recording --
  const startRecording = async () => {
    if (!cameraRef.current || !cameraReady) return;
    setRecording(true);
    startTimer();

    // Grab GPS location silently
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCaptureLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch {}

    try {
      const result = await cameraRef.current.recordAsync({ maxDuration: 10 });
      if (result?.uri) {
        setVideoUri(result.uri);
        setPhase('review');
      }
    } catch {
      // recording was stopped or errored
    } finally {
      setRecording(false);
      stopTimer();
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
    stopTimer();
  };

  const handleCapturePress = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleRetake = () => {
    setVideoUri(null);
    setPhase('camera');
    setElapsed(0);
  };

  const handleSubmit = () => {
    navigation.replace('Verifying', { routine, videoUri: videoUri ?? undefined, location: captureLocation });
  };

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.overlayBtn}
            accessibilityLabel="Close camera"
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {recording && (
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={[typography.labelLg, { color: '#fff' }]}>
                {formatTime(elapsed)}
              </Text>
            </View>
          )}

          {!recording && (
            <TouchableOpacity
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              style={styles.overlayBtn}
              accessibilityLabel="Flip camera"
            >
              <MaterialIcons name="flip-camera-ios" size={24} color="#fff" />
            </TouchableOpacity>
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

        <TouchableOpacity
          onPress={handleCapturePress}
          style={[styles.captureBtn, recording && styles.captureBtnRec]}
          accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
          disabled={!cameraReady}
        >
          <View style={[styles.captureInner, recording && styles.captureInnerRec]} />
        </TouchableOpacity>

        <View style={styles.controlSpacer} />
      </View>

      <View style={styles.hintBar}>
        <Text style={[typography.labelSm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
          {!cameraReady
            ? 'Preparing camera...'
            : recording
            ? 'Perform the routine, then tap to stop'
            : 'Tap to start recording your routine'}
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
          <Button label="Submit for Verification" onPress={onSubmit} />
          <Button
            label="Retake"
            variant="secondary"
            onPress={onRetake}
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
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(186,26,26,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
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
