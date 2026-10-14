/** Counts how many amounts fit in a budget of 54880.0, in order. */
export function payoutTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54880) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a payout tier score falls in. */
export function classifyPayoutTier(score: number): string {
  if (score < 16.6) return "low";
  if (score < 27.1) return "critical";
  if (score < 60.3) return "high";
  return "watch";
}
