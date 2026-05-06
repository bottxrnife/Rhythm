import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../theme';

type Props = {
  title?: string;
  onAvatarPress?: () => void;
  onSettingsPress?: () => void;
};

const AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB4Wp9jo7afnvOrefyamvjTEJvxS9f_stKJRdSbratM6o2_bgcLViDjREsBei4gcRQygRTvH3cDhB-AFJkzWpJsxoPwjMwLdEg5bHb2irRoA333SwBfCX7EljI-goFpQiQSv2H1P28DbyaKO9UCUA3IGRQXZndTBfftH1Z4hUOejN4eltV6q8bdhtNjxA_ZO-D3gBLv2vl4v5_yvU1HdtD2EX8PAXQGU8G2t1XBNTre2jImRztpMELHhBrAfs-yKKdw48cst8KIt1Gq';

export function TopBar({ title = 'Rhythm', onAvatarPress, onSettingsPress }: Props) {
  const handleSettingsPress = () => {
    Haptics.selectionAsync();
    onSettingsPress?.();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onAvatarPress}
        style={styles.avatar}
        accessibilityLabel="Profile"
      >
        <Image source={{ uri: AVATAR_URI }} style={styles.avatarImage} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        onPress={handleSettingsPress}
        style={styles.iconBtn}
        accessibilityLabel="Settings"
      >
        <MaterialIcons name="settings" size={24} color={colors.primaryContainer} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.marginPage,
    paddingVertical: 16,
    backgroundColor: colors.topBar,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  title: {
    ...typography.headlineMd,
    color: colors.primaryContainer,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
