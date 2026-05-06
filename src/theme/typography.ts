import { TextStyle } from 'react-native';

const fontFamily = 'PlusJakartaSans';

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: `${fontFamily}_700Bold`,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
  },
  headlineLg: {
    fontFamily: `${fontFamily}_600SemiBold`,
    fontSize: 24,
    lineHeight: 31,
  },
  headlineMd: {
    fontFamily: `${fontFamily}_600SemiBold`,
    fontSize: 20,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: `${fontFamily}_400Regular`,
    fontSize: 18,
    lineHeight: 29,
  },
  bodyMd: {
    fontFamily: `${fontFamily}_400Regular`,
    fontSize: 16,
    lineHeight: 24,
  },
  labelLg: {
    fontFamily: `${fontFamily}_600SemiBold`,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.14,
  },
  labelSm: {
    fontFamily: `${fontFamily}_500Medium`,
    fontSize: 12,
    lineHeight: 14,
  },
};
