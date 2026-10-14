/** Counts how many amounts fit in a budget of 61381.0, in order. */
export function stepPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61381) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a step plan score falls in. */
export function classifyStepPlan(score: number): string {
  if (score < 25) return "minimal";
  if (score < 84.8) return "high";
  return "critical";
}
