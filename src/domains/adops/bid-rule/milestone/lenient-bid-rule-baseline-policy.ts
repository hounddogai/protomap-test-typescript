export function lenientBidRuleBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a lenient bid rule baseline score falls in. */
export function classifyLenientBidRuleBaseline(score: number): string {
  if (score < 6.7) return "medium";
  if (score < 46.8) return "watch";
  if (score < 81.4) return "ok";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 1700.0, in order. */
export function lenientBidRuleBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1700) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
