import { colors } from '../colors';
import { typography } from '../typography';
import { spacing } from '../spacing';
import { radii, shadows } from '../index';

describe('theme tokens', () => {
  describe('colors', () => {
    it('has all required surface colors', () => {
      expect(colors.background).toBe('#fcf9f3');
      expect(colors.surface).toBe('#fcf9f3');
      expect(colors.surfaceContainerLowest).toBe('#ffffff');
      expect(colors.surfaceContainer).toBeTruthy();
      expect(colors.surfaceContainerHigh).toBeTruthy();
      expect(colors.surfaceContainerHighest).toBeTruthy();
    });

    it('has primary color family', () => {
      expect(colors.primary).toBe('#465547');
      expect(colors.onPrimary).toBe('#ffffff');
      expect(colors.primaryContainer).toBeTruthy();
      expect(colors.primaryFixed).toBeTruthy();
    });

    it('has secondary color family', () => {
      expect(colors.secondary).toBe('#94492d');
      expect(colors.onSecondary).toBe('#ffffff');
    });

    it('has tertiary color family (rewards)', () => {
      expect(colors.tertiary).toBe('#674c1a');
      expect(colors.onTertiary).toBe('#ffffff');
      expect(colors.tertiaryFixed).toBeTruthy();
    });

    it('has error colors', () => {
      expect(colors.error).toBe('#ba1a1a');
      expect(colors.onError).toBe('#ffffff');
    });

    it('all color values are valid hex or named colors', () => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      for (const [key, value] of Object.entries(colors)) {
        expect(value).toMatch(hexRegex);
      }
    });
  });

  describe('typography', () => {
    it('has all 7 type scale levels', () => {
      const levels = ['display', 'headlineLg', 'headlineMd', 'bodyLg', 'bodyMd', 'labelLg', 'labelSm'];
      for (const level of levels) {
        expect(typography[level]).toBeDefined();
        expect(typography[level].fontSize).toBeGreaterThan(0);
        expect(typography[level].fontFamily).toContain('PlusJakartaSans');
      }
    });

    it('font sizes decrease from display to labelSm', () => {
      expect(typography.display.fontSize).toBeGreaterThan(typography.headlineLg.fontSize!);
      expect(typography.headlineLg.fontSize).toBeGreaterThan(typography.headlineMd.fontSize!);
      expect(typography.headlineMd.fontSize).toBeGreaterThan(typography.bodyLg.fontSize!);
      expect(typography.bodyLg.fontSize).toBeGreaterThan(typography.bodyMd.fontSize!);
      expect(typography.bodyMd.fontSize).toBeGreaterThan(typography.labelLg.fontSize!);
      expect(typography.labelLg.fontSize).toBeGreaterThan(typography.labelSm.fontSize!);
    });
  });

  describe('spacing', () => {
    it('follows 4px grid', () => {
      expect(spacing.unit).toBe(4);
      expect(spacing.stackSm % 4).toBe(0);
      expect(spacing.stackMd % 4).toBe(0);
      expect(spacing.stackLg % 4).toBe(0);
      expect(spacing.gutter % 4).toBe(0);
      expect(spacing.marginPage % 4).toBe(0);
      expect(spacing.touchTarget % 4).toBe(0);
    });

    it('touch target meets accessibility minimum (48px)', () => {
      expect(spacing.touchTarget).toBeGreaterThanOrEqual(48);
    });
  });

  describe('radii', () => {
    it('has expected scale', () => {
      expect(radii.sm).toBeLessThan(radii.md);
      expect(radii.md).toBeLessThan(radii.lg);
      expect(radii.lg).toBeLessThan(radii.xl);
      expect(radii.xl).toBeLessThan(radii.xxl);
      expect(radii.full).toBe(9999);
    });
  });

  describe('shadows', () => {
    it('has three shadow presets', () => {
      expect(shadows.diffuse).toBeDefined();
      expect(shadows.soft).toBeDefined();
      expect(shadows.button).toBeDefined();
    });

    it('each shadow has required properties', () => {
      for (const shadow of [shadows.diffuse, shadows.soft, shadows.button]) {
        expect(shadow.shadowColor).toBeTruthy();
        expect(shadow.shadowOffset).toBeDefined();
        expect(typeof shadow.shadowOpacity).toBe('number');
        expect(typeof shadow.shadowRadius).toBe('number');
        expect(typeof shadow.elevation).toBe('number');
      }
    });
  });
});
