import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, typography, spacing } from '../theme';

type Props = {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
};

export function Chip({ label, icon, active, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, active && styles.active]}
      accessibilityRole="button"
    >
      <View style={styles.inner}>
        {icon}
        <Text style={[typography.bodyMd, styles.text, active && styles.activeText]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
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
