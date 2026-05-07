import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, View, Animated } from 'react-native';
import { colors, typography, spacing } from '../theme';

type Props = {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
};

export function Chip({ label, icon, active, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 36,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 28,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.chip, active && styles.active]}
        accessibilityRole="button"
        accessibilityState={{ selected: !!active }}
        accessibilityLabel={label}
      >
        <View style={styles.inner}>
          {icon}
          <Text style={[typography.bodyMd, styles.text, active && styles.activeText]}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: spacing.touchTarget,
    paddingHorizontal: 24,
    borderRadius: 9999,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
  },
  active: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primary,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: colors.onSurface,
  },
  activeText: {
    color: colors.primary,
  },
});
