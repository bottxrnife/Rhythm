import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, shadows } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  loading = false,
  disabled = false,
}: Props) {
  const containerStyle = variantStyles[variant].container;
  const textStyle = variantStyles[variant].text;
  const scale = useRef(new Animated.Value(1)).current;
  const isInteractive = !disabled && !loading;

  const onPressIn = () => {
    if (!isInteractive) return;
    Animated.spring(scale, {
      toValue: 0.96,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 32,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const indicatorColor =
    variant === 'primary' ? (colors.onPrimary as string) : (colors.primary as string);

  return (
    <Animated.View style={{ transform: [{ scale }], alignSelf: 'stretch' }}>
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={!isInteractive}
        style={[styles.base, containerStyle, !isInteractive && styles.disabled, style]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
      >
        <View style={styles.inner}>
          {loading ? (
            <ActivityIndicator size="small" color={indicatorColor} />
          ) : (
            <>
              {icon}
              <Text style={[typography.labelLg, textStyle]}>{label}</Text>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.55,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      ...shadows.button,
    },
    text: { color: colors.onPrimary },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    text: { color: colors.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary },
  },
};
