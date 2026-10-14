/** Names the band a cohort policy score falls in. */
export function classifyCohortPolicy(score: number): string {
  if (score < 85.3) return "elevated";
  if (score < 91.3) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 24034.0, in order. */
export function cohortPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24034) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
