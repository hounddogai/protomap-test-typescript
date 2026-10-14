/** Counts how many amounts fit in a budget of 25820.0, in order. */
export function warmupAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25820) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function warmupAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a warmup allocation score falls in. */
export function classifyWarmupAllocation(score: number): string {
  if (score < 2.9) return "medium";
  if (score < 74.8) return "critical";
  if (score < 85.4) return "elevated";
  if (score < 92.9) return "high";
  return "minimal";
}
