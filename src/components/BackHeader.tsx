import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
      </TouchableOpacity>
      {title && (
        <Text style={[typography.headlineLg, styles.title]}>{title}</Text>
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
  title: {
    flex: 1,
    color: colors.onSurface,
  },
  spacer: {
    width: spacing.touchTarget,
  },
});
