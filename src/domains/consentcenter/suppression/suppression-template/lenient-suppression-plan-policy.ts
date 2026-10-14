/** Counts how many amounts fit in a budget of 27645.0, in order. */
export function lenientSuppressionPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 27645) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient suppression plan score falls in. */
export function classifyLenientSuppressionPlan(score: number): string {
  if (score < 29.4) return "ok";
  if (score < 30) return "high";
  if (score < 84.2) return "medium";
  if (score < 88.9) return "elevated";
  return "critical";
}
