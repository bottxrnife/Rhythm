import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer } from 'expo-video';
import type { VideoThumbnail } from 'expo-video';
import { colors } from '../theme';

const MAX_ACTIVE_GENERATORS = 2;
const MAX_CACHED_THUMBNAILS = 40;

const thumbnailCache = new Map<string, VideoThumbnail>();
let activeGenerators = 0;
let nextRequestId = 0;
const pendingRequests: { id: number; start: () => void }[] = [];

type Props = {
  videoUri: string;
  size?: number;
};

export function VideoThumb({ videoUri, size = 48 }: Props) {
  const currentVideoUri = useRef(videoUri);
  const [thumbnail, setThumbnail] = useState<VideoThumbnail | null>(
    () => thumbnailCache.get(videoUri) ?? null
  );
  const [shouldGenerate, setShouldGenerate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cachedThumbnail = thumbnailCache.get(videoUri);

    currentVideoUri.current = videoUri;
    setThumbnail(cachedThumbnail ?? null);
    setShouldGenerate(false);

    if (!cachedThumbnail) {
      const cancelRequest = requestThumbnailSlot(() => {
        if (!cancelled) {
          setShouldGenerate(true);
        }
      });

      return () => {
        cancelled = true;
        cancelRequest();
      };
    }

    return () => {
      cancelled = true;
    };
  }, [videoUri]);

  const handleGenerated = useCallback((generatedThumbnail: VideoThumbnail | null) => {
    if (currentVideoUri.current !== videoUri) {
      releaseThumbnailSlot();
      return;
    }

    if (generatedThumbnail) {
      cacheThumbnail(videoUri, generatedThumbnail);
      setThumbnail(generatedThumbnail);
    }
    setShouldGenerate(false);
    releaseThumbnailSlot();
  }, [videoUri]);

  if (!thumbnail) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius: size * 0.2 }]}>
        <MaterialIcons name="videocam" size={size * 0.45} color={colors.outlineVariant} />
        {shouldGenerate && (
          <ThumbnailGenerator videoUri={videoUri} onGenerated={handleGenerated} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.2 }]}>
      <Image source={thumbnail} style={styles.image} contentFit="cover" />
      <View style={styles.playOverlay}>
        <MaterialIcons name="play-circle" size={size * 0.4} color="rgba(255,255,255,0.85)" />
      </View>
    </View>
  );
}

function ThumbnailGenerator({
  videoUri,
  onGenerated,
}: {
  videoUri: string;
  onGenerated: (thumbnail: VideoThumbnail | null) => void;
}) {
  const player = useVideoPlayer(videoUri, () => {});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const thumbs = await player.generateThumbnailsAsync(0);
        onGenerated(!cancelled && thumbs.length > 0 ? thumbs[0] : null);
      } catch {
        onGenerated(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onGenerated, player]);

  return null;
}

function requestThumbnailSlot(start: () => void) {
  const request = { id: nextRequestId++, start };
  pendingRequests.push(request);
  pumpThumbnailQueue();

  return () => {
    const index = pendingRequests.findIndex((item) => item.id === request.id);
    if (index >= 0) {
      pendingRequests.splice(index, 1);
    }
  };
}

function releaseThumbnailSlot() {
  activeGenerators = Math.max(0, activeGenerators - 1);
  pumpThumbnailQueue();
}

function pumpThumbnailQueue() {
  while (activeGenerators < MAX_ACTIVE_GENERATORS && pendingRequests.length > 0) {
    const request = pendingRequests.shift();
    if (request) {
      activeGenerators += 1;
      request.start();
    }
  }
}

function cacheThumbnail(videoUri: string, thumbnail: VideoThumbnail) {
  thumbnailCache.delete(videoUri);
  thumbnailCache.set(videoUri, thumbnail);

  while (thumbnailCache.size > MAX_CACHED_THUMBNAILS) {
    const oldestKey = thumbnailCache.keys().next().value;
    if (!oldestKey) return;
    thumbnailCache.delete(oldestKey);
  }
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
