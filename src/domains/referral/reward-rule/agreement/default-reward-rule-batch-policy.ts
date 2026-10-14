/** Counts how many amounts fit in a budget of 30407.0, in order. */
export function defaultRewardRuleBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30407) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default reward rule batch score falls in. */
export function classifyDefaultRewardRuleBatch(score: number): string {
  if (score < 76.8) return "elevated";
  if (score < 93.3) return "high";
  return "minimal";
}
