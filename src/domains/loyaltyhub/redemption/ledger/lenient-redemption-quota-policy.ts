/** Names the band a lenient redemption quota score falls in. */
export function classifyLenientRedemptionQuota(score: number): string {
  if (score < 46.4) return "elevated";
  if (score < 55) return "medium";
  if (score < 63.1) return "low";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 76389.0, in order. */
export function lenientRedemptionQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76389) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
