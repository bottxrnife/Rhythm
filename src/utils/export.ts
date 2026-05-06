import type { CompletionData } from '../navigation/types';

/**
 * Formats completion data as a CSV string for export.
 */
export function completionsToCSV(completions: CompletionData[]): string {
  const headers = [
    'Task',
    'Date',
    'Time',
    'Credits',
    'Sponsor',
    'Routine ID',
    'Self Verified',
    'Latitude',
    'Longitude',
    'TX Signature',
  ];

  const rows = completions.map((c) => {
    const date = new Date(c.timestamp);
    return [
      escapeCSV(c.task),
      date.toLocaleDateString('en-US'),
      date.toLocaleTimeString('en-US'),
      c.credits,
      escapeCSV(c.sponsor),
      c.routineId,
      c.selfVerified ? 'Yes' : 'No',
      c.location?.latitude.toFixed(6) ?? '',
      c.location?.longitude.toFixed(6) ?? '',
      c.txSignature ?? '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates a summary of completion statistics.
 */
export function completionsSummary(completions: CompletionData[]): {
  totalCompletions: number;
  totalCredits: number;
  uniqueRoutines: number;
  verifiedCount: number;
  selfVerifiedCount: number;
  topRoutine: string | null;
  topSponsor: string | null;
} {
  if (completions.length === 0) {
    return {
      totalCompletions: 0,
      totalCredits: 0,
      uniqueRoutines: 0,
      verifiedCount: 0,
      selfVerifiedCount: 0,
      topRoutine: null,
      topSponsor: null,
    };
  }

  const routineCounts = new Map<string, number>();
  const sponsorCounts = new Map<string, number>();
  let totalCredits = 0;
  let verifiedCount = 0;
  let selfVerifiedCount = 0;

  for (const c of completions) {
    totalCredits += parseFloat(c.credits.replace('+', '')) || 0;
    routineCounts.set(c.routineId, (routineCounts.get(c.routineId) ?? 0) + 1);
    sponsorCounts.set(c.sponsor, (sponsorCounts.get(c.sponsor) ?? 0) + 1);
    if (c.selfVerified) {
      selfVerifiedCount++;
    } else {
      verifiedCount++;
    }
  }

  const topRoutineEntry = [...routineCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topSponsorEntry = [...sponsorCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    totalCompletions: completions.length,
    totalCredits,
    uniqueRoutines: routineCounts.size,
    verifiedCount,
    selfVerifiedCount,
    topRoutine: topRoutineEntry?.[0] ?? null,
    topSponsor: topSponsorEntry?.[0] ?? null,
  };
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
