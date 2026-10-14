/** Names the band a default placement digest score falls in. */
export function classifyDefaultPlacementDigest(score: number): string {
  if (score < 11.8) return "elevated";
  if (score < 59.6) return "low";
  return "critical";
}

/** Counts how many amounts fit in a budget of 67776.0, in order. */
export function defaultPlacementDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67776) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
