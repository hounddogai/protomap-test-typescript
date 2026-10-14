export function levelPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 28002.0, in order. */
export function levelPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 28002) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a level plan score falls in. */
export function classifyLevelPlan(score: number): string {
  if (score < 25.8) return "watch";
  if (score < 31.7) return "high";
  if (score < 45.1) return "low";
  return "elevated";
}
