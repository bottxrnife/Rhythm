/**
 * Extra edge-case tests for the CSV export so we don't regress with weird
 * completion data (apostrophes, commas, long strings, missing optional fields).
 */
import { completionsToCSV, completionsSummary } from '../export';
import type { CompletionData } from '../../navigation/types';

function mk(overrides: Partial<CompletionData> = {}): CompletionData {
  return {
    task: 'Hydrate',
    timestamp: Date.now(),
    icon: 'water-drop',
    credits: '+2.50',
    sponsor: 'Liquid Death',
    routineId: 'hydrate',
    ...overrides,
  };
}

describe('CSV export edge cases', () => {
  it('escapes commas in task names', () => {
    const csv = completionsToCSV([mk({ task: 'Hydrate, gently' })]);
    // Fields with commas must be wrapped in double quotes
    expect(csv).toMatch(/"Hydrate, gently"/);
  });

  it('escapes embedded double quotes by doubling them', () => {
    const csv = completionsToCSV([mk({ task: 'Take "A" pill' })]);
    expect(csv).toMatch(/"Take ""A"" pill"/);
  });

  it('escapes newlines in task names', () => {
    const csv = completionsToCSV([mk({ task: 'Line 1\nLine 2' })]);
    // Newlines must be preserved inside quoted field
    expect(csv).toMatch(/"Line 1\nLine 2"/);
  });

  it('handles an empty completions list', () => {
    const csv = completionsToCSV([]);
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(1); // Just the header
  });

  it('summary returns zeros on empty input', () => {
    const summary = completionsSummary([]);
    expect(summary.totalCompletions).toBe(0);
    expect(summary.totalCredits).toBe(0);
    expect(summary.topRoutine).toBeNull();
  });

  it('summary picks the top routine id by frequency', () => {
    const items = [
      mk({ routineId: 'a', task: 'A' }),
      mk({ routineId: 'a', task: 'A' }),
      mk({ routineId: 'b', task: 'B' }),
    ];
    const summary = completionsSummary(items);
    expect(summary.topRoutine).toBe('a');
    expect(summary.totalCompletions).toBe(3);
  });
});
