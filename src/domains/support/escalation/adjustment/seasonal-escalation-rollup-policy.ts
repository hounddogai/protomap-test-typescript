export function seasonalEscalationRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 92176.0, in order. */
export function seasonalEscalationRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92176) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal escalation rollup score falls in. */
export function classifySeasonalEscalationRollup(score: number): string {
  if (score < 14.5) return "ok";
  if (score < 26.7) return "high";
  if (score < 56) return "minimal";
  return "watch";
}
