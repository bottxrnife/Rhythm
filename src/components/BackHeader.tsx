import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../theme';

type Props = {
  title?: string;
};

export function BackHeader({ title }: Props) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={8}
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
      </Pressable>
      {title && (
        <Text style={[typography.headlineLg, styles.title]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      )}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginPage,
    paddingVertical: 16,
    gap: spacing.gutter,
  },
  backBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  title: {
    flex: 1,
    color: colors.onSurface,
  },
  spacer: {
    width: spacing.touchTarget,
  },
});
