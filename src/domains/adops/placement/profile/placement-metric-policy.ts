/** Counts how many amounts fit in a budget of 58380.0, in order. */
export function placementMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58380) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function placementMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
