/** Counts how many amounts fit in a budget of 27877.0, in order. */
export function lenientRetentionRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 27877) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient retention request score falls in. */
export function classifyLenientRetentionRequest(score: number): string {
  if (score < 61.7) return "high";
  if (score < 95.9) return "minimal";
  return "critical";
}

export function lenientRetentionRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
