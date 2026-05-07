/**
 * Streak boundary regression tests — month rollover, double-digit days.
 *
 * These guard the fix for the getDayKey bug where days spanning a month
 * boundary used to be mis-parsed (e.g. "2026-11-30" vs "2026-12-1") and
 * break the streak calculation.
 */
import { getDayKey, parseDayKey } from '../../utils/time';

describe('day key boundary handling', () => {
  it('produces strings that sort chronologically', () => {
    // Build a range of day keys from Dec 28 2026 to Jan 3 2027 and verify
    // that string-sorting matches chronological order.
    const keys: string[] = [];
    const start = new Date(2026, 11, 28).getTime(); // Dec 28 2026
    for (let i = 0; i < 7; i++) {
      keys.push(getDayKey(start + i * 86400000));
    }
    const sorted = [...keys].sort();
    expect(sorted).toEqual(keys);
  });

  it('round-trips through parseDayKey for every day in a month', () => {
    for (let day = 1; day <= 31; day++) {
      const d = new Date(2026, 0, day); // January
      const key = getDayKey(d.getTime());
      const parsed = parseDayKey(key);
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(0);
      expect(parsed.getDate()).toBe(day);
    }
  });

  it('zero-pads single-digit months and days', () => {
    const key = getDayKey(new Date(2026, 0, 5).getTime()); // Jan 5
    expect(key).toBe('2026-01-05');
  });

  it('distinguishes days that differ only by position (Mar 1 vs Feb 31 nonsense)', () => {
    // JavaScript will happily normalize Feb 31 to Mar 3. Make sure getDayKey
    // reflects the normalized date, not the input we asked for.
    const d = new Date(2026, 1, 31); // Feb 31 → Mar 3
    expect(getDayKey(d.getTime())).toBe('2026-03-03');
  });

  it('sorts a year-wrapping sequence in the expected order', () => {
    const days = [
      getDayKey(new Date(2026, 11, 29).getTime()), // Dec 29 2026
      getDayKey(new Date(2026, 11, 30).getTime()), // Dec 30 2026
      getDayKey(new Date(2026, 11, 31).getTime()), // Dec 31 2026
      getDayKey(new Date(2027, 0, 1).getTime()),   // Jan 1 2027
      getDayKey(new Date(2027, 0, 2).getTime()),   // Jan 2 2027
    ];
    expect([...days].sort()).toEqual(days);
  });
});
