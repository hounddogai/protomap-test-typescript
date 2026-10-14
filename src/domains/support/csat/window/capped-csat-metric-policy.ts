/** Names the band a capped csat metric score falls in. */
export function classifyCappedCsatMetric(score: number): string {
  if (score < 20.8) return "medium";
  if (score < 60.9) return "critical";
  return "high";
}

export function cappedCsatMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 55473.0, in order. */
export function cappedCsatMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55473) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
