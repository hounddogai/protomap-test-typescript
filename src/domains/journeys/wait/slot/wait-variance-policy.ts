/** Counts how many amounts fit in a budget of 82132.0, in order. */
export function waitVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82132) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function waitVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a wait variance score falls in. */
export function classifyWaitVariance(score: number): string {
  if (score < 83.5) return "high";
  if (score < 88.3) return "watch";
  return "ok";
}
