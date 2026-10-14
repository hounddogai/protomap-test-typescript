/** Counts how many amounts fit in a budget of 86276.0, in order. */
export function scheduledFlightRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86276) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a scheduled flight rule score falls in. */
export function classifyScheduledFlightRule(score: number): string {
  if (score < 25.8) return "critical";
  if (score < 29.7) return "ok";
  if (score < 43.4) return "high";
  return "elevated";
}

export function scheduledFlightRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
