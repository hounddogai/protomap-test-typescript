/** Names the band a manual bid rule claim score falls in. */
export function classifyManualBidRuleClaim(score: number): string {
  if (score < 34.7) return "elevated";
  if (score < 44.5) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 38541.0, in order. */
export function manualBidRuleClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38541) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
