export function manualEnrollmentSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a manual enrollment snapshot score falls in. */
export function classifyManualEnrollmentSnapshot(score: number): string {
  if (score < 45.6) return "low";
  if (score < 56.6) return "high";
  if (score < 62.8) return "medium";
  return "watch";
}

/** Counts how many amounts fit in a budget of 58524.0, in order. */
export function manualEnrollmentSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58524) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
