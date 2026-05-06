export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const shadows = {
  diffuse: {
    shadowColor: '#1c1c18',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
  },
  soft: {
    shadowColor: '#536254',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  button: {
    shadowColor: '#465547',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 3,
  },
} as const;
