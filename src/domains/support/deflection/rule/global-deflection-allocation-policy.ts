/** Counts how many amounts fit in a budget of 71601.0, in order. */
export function globalDeflectionAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71601) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalDeflectionAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a global deflection allocation score falls in. */
export function classifyGlobalDeflectionAllocation(score: number): string {
  if (score < 9.6) return "medium";
  if (score < 50.9) return "high";
  if (score < 78.4) return "critical";
  return "watch";
}
