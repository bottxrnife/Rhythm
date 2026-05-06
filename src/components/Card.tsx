import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows, radii } from '../theme';

type Props = {
  children: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
};

export function Card({ children, accentColor, style, onPress }: Props) {
  const Wrapper = onPress ? Pressable : View;
  const pressableProps = onPress
    ? {
        onPress,
        android_ripple: { color: colors.surfaceContainerHigh, borderless: false },
        style: ({ pressed }: { pressed: boolean }) => [
          styles.card,
          shadows.diffuse,
          style,
          pressed && styles.pressed,
        ],
      }
    : {
        style: [styles.card, shadows.diffuse, style],
      };

  return (
    <Wrapper {...(pressableProps as any)}>
      {accentColor && (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      )}
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: 20,
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radii.xl,
    borderBottomLeftRadius: radii.xl,
  },
});
