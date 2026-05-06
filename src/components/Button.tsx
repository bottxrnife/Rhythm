import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, typography, shadows } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
}: Props) {
  const containerStyle = variantStyles[variant].container;
  const textStyle = variantStyles[variant].text;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.base, containerStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.inner}>
        {icon}
        <Text style={[typography.labelLg, textStyle]}>{label}</Text>
      </View>
    </TouchableOpacity>
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
