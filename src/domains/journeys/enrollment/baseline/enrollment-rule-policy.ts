/** Names the band a enrollment rule score falls in. */
export function classifyEnrollmentRule(score: number): string {
  if (score < 42.3) return "ok";
  if (score < 47.1) return "minimal";
  if (score < 66) return "critical";
  if (score < 88.6) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 17491.0, in order. */
export function enrollmentRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17491) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
