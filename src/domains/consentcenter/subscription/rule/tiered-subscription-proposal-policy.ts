/** Counts how many amounts fit in a budget of 54703.0, in order. */
export function tieredSubscriptionProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54703) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered subscription proposal score falls in. */
export function classifyTieredSubscriptionProposal(score: number): string {
  if (score < 31.3) return "critical";
  if (score < 60.8) return "ok";
  return "watch";
}
