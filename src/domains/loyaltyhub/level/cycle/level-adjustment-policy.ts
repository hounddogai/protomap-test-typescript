/** Names the band a level adjustment score falls in. */
export function classifyLevelAdjustment(score: number): string {
  if (score < 5) return "high";
  if (score < 63) return "medium";
  if (score < 65.7) return "low";
  return "ok";
}

/** Counts how many amounts fit in a budget of 81304.0, in order. */
export function levelAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81304) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
