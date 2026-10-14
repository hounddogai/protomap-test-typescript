/** Names the band a legacy suppression claim score falls in. */
export function classifyLegacySuppressionClaim(score: number): string {
  if (score < 20.7) return "high";
  if (score < 63.3) return "critical";
  return "watch";
}

/** Counts how many amounts fit in a budget of 87733.0, in order. */
export function legacySuppressionClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87733) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
