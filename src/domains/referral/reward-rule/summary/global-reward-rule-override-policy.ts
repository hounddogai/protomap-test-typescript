/** Counts how many amounts fit in a budget of 56413.0, in order. */
export function globalRewardRuleOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56413) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a global reward rule override score falls in. */
export function classifyGlobalRewardRuleOverride(score: number): string {
  if (score < 16.5) return "ok";
  if (score < 84.1) return "high";
  if (score < 98.9) return "minimal";
  return "medium";
}
