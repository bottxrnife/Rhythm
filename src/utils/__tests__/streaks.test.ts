import { getStreakMilestone, getNextMilestone, getMilestoneProgress } from '../streaks';

describe('streak utilities', () => {
  describe('getStreakMilestone', () => {
    it('returns null for non-milestone streaks', () => {
      expect(getStreakMilestone(0)).toBeNull();
      expect(getStreakMilestone(1)).toBeNull();
      expect(getStreakMilestone(2)).toBeNull();
      expect(getStreakMilestone(4)).toBeNull();
      expect(getStreakMilestone(10)).toBeNull();
    });

    it('returns milestone for 3-day streak', () => {
      const milestone = getStreakMilestone(3);
      expect(milestone).not.toBeNull();
      expect(milestone!.message).toContain('3-day');
      expect(milestone!.emoji).toBe('🌱');
    });

    it('returns milestone for 7-day streak', () => {
      const milestone = getStreakMilestone(7);
      expect(milestone).not.toBeNull();
      expect(milestone!.message).toContain('1 week');
    });

    it('returns milestone for 21-day streak', () => {
      const milestone = getStreakMilestone(21);
      expect(milestone).not.toBeNull();
      expect(milestone!.message).toContain('habit');
    });

    it('returns milestone for 30-day streak', () => {
      const milestone = getStreakMilestone(30);
      expect(milestone).not.toBeNull();
      expect(milestone!.emoji).toBe('🏆');
    });

    it('returns milestone for 365-day streak', () => {
      const milestone = getStreakMilestone(365);
      expect(milestone).not.toBeNull();
      expect(milestone!.message).toContain('year');
    });
  });

  describe('getNextMilestone', () => {
    it('returns 3 for streak of 0', () => {
      expect(getNextMilestone(0)).toBe(3);
    });

    it('returns 7 for streak of 3', () => {
      expect(getNextMilestone(3)).toBe(7);
    });

    it('returns 14 for streak of 7', () => {
      expect(getNextMilestone(7)).toBe(14);
    });

    it('returns 30 for streak of 21', () => {
      expect(getNextMilestone(21)).toBe(30);
    });

    it('returns streak+1 for very high streaks', () => {
      expect(getNextMilestone(365)).toBe(366);
    });
  });

  describe('getMilestoneProgress', () => {
    it('returns 0 for streak of 0', () => {
      expect(getMilestoneProgress(0)).toBe(0);
    });

    it('returns ~0.33 for streak of 1 (toward 3)', () => {
      expect(getMilestoneProgress(1)).toBeCloseTo(1 / 3, 2);
    });

    it('returns ~0.67 for streak of 2 (toward 3)', () => {
      expect(getMilestoneProgress(2)).toBeCloseTo(2 / 3, 2);
    });

    it('returns 0.5 for streak of 5 (between 3 and 7)', () => {
      expect(getMilestoneProgress(5)).toBeCloseTo(0.5, 2);
    });

    it('returns progress between milestones', () => {
      // Between 7 and 14: streak 10 = 3/7 ≈ 0.43
      expect(getMilestoneProgress(10)).toBeCloseTo(3 / 7, 2);
    });
  });
});
