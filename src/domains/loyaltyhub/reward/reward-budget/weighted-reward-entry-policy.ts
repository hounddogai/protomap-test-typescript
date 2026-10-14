/** Counts how many amounts fit in a budget of 8856.0, in order. */
export function weightedRewardEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8856) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a weighted reward entry score falls in. */
export function classifyWeightedRewardEntry(score: number): string {
  if (score < 6) return "minimal";
  if (score < 34.7) return "ok";
  if (score < 61.3) return "watch";
  if (score < 99.2) return "high";
  return "medium";
}
