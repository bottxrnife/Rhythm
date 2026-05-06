import { completionsToCSV, completionsSummary } from '../export';
import type { CompletionData } from '../../navigation/types';

function makeCompletion(overrides: Partial<CompletionData> = {}): CompletionData {
  return {
    task: 'Hydrate',
    timestamp: new Date(2026, 4, 3, 10, 30, 0).getTime(),
    icon: 'water-drop',
    credits: '+2.50',
    sponsor: 'Liquid Death',
    routineId: 'hydrate',
    ...overrides,
  };
}

describe('completionsToCSV', () => {
  it('returns headers for empty array', () => {
    const csv = completionsToCSV([]);
    expect(csv).toContain('Task,Date,Time,Credits,Sponsor');
    expect(csv.split('\n')).toHaveLength(1);
  });

  it('formats a single completion', () => {
    const csv = completionsToCSV([makeCompletion()]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Hydrate');
    expect(lines[1]).toContain('+2.50');
    expect(lines[1]).toContain('Liquid Death');
    expect(lines[1]).toContain('hydrate');
    expect(lines[1]).toContain('No'); // not self-verified
  });

  it('formats self-verified completion', () => {
    const csv = completionsToCSV([makeCompletion({ selfVerified: true, credits: '+0.00' })]);
    expect(csv).toContain('Yes');
  });

  it('includes location when present', () => {
    const csv = completionsToCSV([
      makeCompletion({ location: { latitude: 37.7749, longitude: -122.4194 } }),
    ]);
    expect(csv).toContain('37.774900');
    expect(csv).toContain('-122.419400');
  });

  it('includes tx signature when present', () => {
    const csv = completionsToCSV([makeCompletion({ txSignature: 'abc123def456' })]);
    expect(csv).toContain('abc123def456');
  });

  it('escapes commas in task names', () => {
    const csv = completionsToCSV([makeCompletion({ task: 'Task, with comma' })]);
    expect(csv).toContain('"Task, with comma"');
  });

  it('handles multiple completions', () => {
    const csv = completionsToCSV([
      makeCompletion({ task: 'First' }),
      makeCompletion({ task: 'Second' }),
      makeCompletion({ task: 'Third' }),
    ]);
    expect(csv.split('\n')).toHaveLength(4); // header + 3 rows
  });
});

describe('completionsSummary', () => {
  it('returns zeros for empty array', () => {
    const summary = completionsSummary([]);
    expect(summary.totalCompletions).toBe(0);
    expect(summary.totalCredits).toBe(0);
    expect(summary.uniqueRoutines).toBe(0);
    expect(summary.verifiedCount).toBe(0);
    expect(summary.selfVerifiedCount).toBe(0);
    expect(summary.topRoutine).toBeNull();
    expect(summary.topSponsor).toBeNull();
  });

  it('computes totals correctly', () => {
    const summary = completionsSummary([
      makeCompletion({ credits: '+2.50' }),
      makeCompletion({ credits: '+3.00', routineId: 'brush-teeth' }),
      makeCompletion({ credits: '+0.00', selfVerified: true }),
    ]);

    expect(summary.totalCompletions).toBe(3);
    expect(summary.totalCredits).toBe(5.5);
    expect(summary.uniqueRoutines).toBe(2);
    expect(summary.verifiedCount).toBe(2);
    expect(summary.selfVerifiedCount).toBe(1);
  });

  it('identifies top routine', () => {
    const summary = completionsSummary([
      makeCompletion({ routineId: 'hydrate' }),
      makeCompletion({ routineId: 'hydrate' }),
      makeCompletion({ routineId: 'brush-teeth' }),
    ]);

    expect(summary.topRoutine).toBe('hydrate');
  });

  it('identifies top sponsor', () => {
    const summary = completionsSummary([
      makeCompletion({ sponsor: 'Liquid Death' }),
      makeCompletion({ sponsor: 'Liquid Death' }),
      makeCompletion({ sponsor: 'Colgate' }),
    ]);

    expect(summary.topSponsor).toBe('Liquid Death');
  });
});
