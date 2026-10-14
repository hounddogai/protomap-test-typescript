/** Names the band a weighted nudge metric score falls in. */
export function classifyWeightedNudgeMetric(score: number): string {
  if (score < 39) return "ok";
  if (score < 43.5) return "elevated";
  return "critical";
}

export function weightedNudgeMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 41741.0, in order. */
export function weightedNudgeMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41741) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
