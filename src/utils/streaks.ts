/**
 * Streak milestone messages.
 * Returns a celebration message when the user hits a milestone, or null otherwise.
 */
export function getStreakMilestone(streak: number): {
  message: string;
  emoji: string;
} | null {
  const milestones: Record<number, { message: string; emoji: string }> = {
    3: { message: '3-day streak! You\'re finding your rhythm.', emoji: '🌱' },
    7: { message: '1 week streak! Consistency is building.', emoji: '🌿' },
    14: { message: '2 weeks! This is becoming a real habit.', emoji: '🌳' },
    21: { message: '21 days! Science says this is a habit now.', emoji: '✨' },
    30: { message: '30-day streak! A full month of showing up.', emoji: '🏆' },
    60: { message: '60 days! You\'re unstoppable.', emoji: '💎' },
    90: { message: '90-day streak! A quarter of a year.', emoji: '👑' },
    100: { message: '100 days! Triple digits.', emoji: '🎯' },
    180: { message: 'Half a year of daily routines!', emoji: '🌟' },
    365: { message: 'One full year! Incredible dedication.', emoji: '🎉' },
  };

  return milestones[streak] ?? null;
}

/**
 * Returns the next milestone the user is working toward.
 */
export function getNextMilestone(streak: number): number {
  const milestones = [3, 7, 14, 21, 30, 60, 90, 100, 180, 365];
  return milestones.find((m) => m > streak) ?? streak + 1;
}

/**
 * Returns progress toward the next milestone as a fraction 0-1.
 */
export function getMilestoneProgress(streak: number): number {
  const milestones = [3, 7, 14, 21, 30, 60, 90, 100, 180, 365];
  const prevMilestone = [...milestones].reverse().find((m) => m <= streak) ?? 0;
  const nextMilestone = milestones.find((m) => m > streak) ?? streak + 1;
  const range = nextMilestone - prevMilestone;
  if (range === 0) return 1;
  return (streak - prevMilestone) / range;
}
