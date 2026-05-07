import { formatCompletionTime, isToday, getDayKey } from '../time';

describe('time utilities', () => {
  describe('isToday', () => {
    it('returns true for a timestamp from today', () => {
      expect(isToday(Date.now())).toBe(true);
    });

    it('returns true for midnight today', () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      expect(isToday(midnight)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = Date.now() - 86400000;
      expect(isToday(yesterday)).toBe(false);
    });

    it('returns false for a timestamp from last week', () => {
      const lastWeek = Date.now() - 7 * 86400000;
      expect(isToday(lastWeek)).toBe(false);
    });

    it('returns false for a future date', () => {
      const tomorrow = Date.now() + 86400000;
      // Tomorrow is not today
      const tomorrowDate = new Date(tomorrow);
      const todayDate = new Date();
      if (tomorrowDate.getDate() !== todayDate.getDate()) {
        expect(isToday(tomorrow)).toBe(false);
      }
    });
  });

  describe('getDayKey', () => {
    it('returns a consistent key for the same day', () => {
      const morning = new Date(2026, 4, 3, 8, 0, 0).getTime();
      const evening = new Date(2026, 4, 3, 20, 0, 0).getTime();
      expect(getDayKey(morning)).toBe(getDayKey(evening));
    });

    it('returns different keys for different days', () => {
      const day1 = new Date(2026, 4, 3, 12, 0, 0).getTime();
      const day2 = new Date(2026, 4, 4, 12, 0, 0).getTime();
      expect(getDayKey(day1)).not.toBe(getDayKey(day2));
    });

    it('returns ISO-style zero-padded format (YYYY-MM-DD)', () => {
      const ts = new Date(2026, 4, 3).getTime(); // May 3, 2026 (month 4 = May 0-indexed)
      const key = getDayKey(ts);
      expect(key).toBe('2026-05-03');
    });

    it('parses back to the same date with parseDayKey', () => {
      const { parseDayKey } = require('../time');
      const ts = new Date(2026, 11, 31).getTime(); // Dec 31
      const key = getDayKey(ts);
      const parsed = parseDayKey(key);
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(11);
      expect(parsed.getDate()).toBe(31);
    });

    it('keeps a month boundary intact (Dec 31 vs Jan 1)', () => {
      const dec31 = getDayKey(new Date(2026, 11, 31).getTime());
      const jan1 = getDayKey(new Date(2027, 0, 1).getTime());
      // These must sort so dec31 < jan1 for the streak calc to work correctly
      expect([dec31, jan1].sort()).toEqual([dec31, jan1]);
    });
  });

  describe('formatCompletionTime', () => {
    it('formats a timestamp from today with "Today"', () => {
      const result = formatCompletionTime(Date.now());
      expect(result).toMatch(/^Today, \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('formats a timestamp from yesterday with "Yesterday"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(14, 30, 0, 0);
      const result = formatCompletionTime(yesterday.getTime());
      expect(result).toMatch(/^Yesterday, \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('formats a timestamp from 3 days ago with "X days ago"', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(10, 0, 0, 0);
      const result = formatCompletionTime(threeDaysAgo.getTime());
      expect(result).toMatch(/^\d+ days ago, \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('formats AM/PM correctly for morning', () => {
      const morning = new Date();
      morning.setHours(9, 15, 0, 0);
      const result = formatCompletionTime(morning.getTime());
      if (isToday(morning.getTime())) {
        expect(result).toContain('9:15 AM');
      }
    });

    it('formats AM/PM correctly for afternoon', () => {
      const afternoon = new Date();
      afternoon.setHours(15, 45, 0, 0);
      const result = formatCompletionTime(afternoon.getTime());
      if (isToday(afternoon.getTime())) {
        expect(result).toContain('3:45 PM');
      }
    });

    it('handles midnight (12:00 AM)', () => {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const result = formatCompletionTime(midnight.getTime());
      expect(result).toContain('12:00 AM');
    });

    it('handles noon (12:00 PM)', () => {
      const noon = new Date();
      noon.setHours(12, 0, 0, 0);
      const result = formatCompletionTime(noon.getTime());
      expect(result).toContain('12:00 PM');
    });
  });
});
