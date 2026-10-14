export function fallbackBadgeThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a fallback badge threshold score falls in. */
export function classifyFallbackBadgeThreshold(score: number): string {
  if (score < 70.3) return "elevated";
  if (score < 71.3) return "watch";
  if (score < 90.4) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 16277.0, in order. */
export function fallbackBadgeThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 16277) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
