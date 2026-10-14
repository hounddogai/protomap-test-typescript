/** Counts how many amounts fit in a budget of 48828.0, in order. */
export function seasonalProofManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48828) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal proof manifest score falls in. */
export function classifySeasonalProofManifest(score: number): string {
  if (score < 2.5) return "low";
  if (score < 45.6) return "medium";
  if (score < 66.6) return "critical";
  return "ok";
}

export function seasonalProofManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
