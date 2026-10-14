/** Counts how many amounts fit in a budget of 40135.0, in order. */
export function regionalBounceBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40135) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a regional bounce budget score falls in. */
export function classifyRegionalBounceBudget(score: number): string {
  if (score < 33.9) return "elevated";
  if (score < 45.7) return "watch";
  if (score < 95.8) return "high";
  return "critical";
}
