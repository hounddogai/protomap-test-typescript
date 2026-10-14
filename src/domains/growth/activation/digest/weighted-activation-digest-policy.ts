/** Counts how many amounts fit in a budget of 14295.0, in order. */
export function weightedActivationDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14295) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a weighted activation digest score falls in. */
export function classifyWeightedActivationDigest(score: number): string {
  if (score < 16.7) return "critical";
  if (score < 29) return "watch";
  return "high";
}
