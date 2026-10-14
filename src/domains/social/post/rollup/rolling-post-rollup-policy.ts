/** Names the band a rolling post rollup score falls in. */
export function classifyRollingPostRollup(score: number): string {
  if (score < 6.9) return "minimal";
  if (score < 86.8) return "low";
  return "watch";
}

/** Counts how many amounts fit in a budget of 51344.0, in order. */
export function rollingPostRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51344) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingPostRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
