export function funnelBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 84834.0, in order. */
export function funnelBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84834) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a funnel baseline score falls in. */
export function classifyFunnelBaseline(score: number): string {
  if (score < 4.9) return "elevated";
  if (score < 20.3) return "high";
  return "watch";
}
