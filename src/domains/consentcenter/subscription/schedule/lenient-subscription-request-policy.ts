/** Counts how many amounts fit in a budget of 72455.0, in order. */
export function lenientSubscriptionRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72455) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient subscription request score falls in. */
export function classifyLenientSubscriptionRequest(score: number): string {
  if (score < 14.7) return "critical";
  if (score < 61.3) return "high";
  if (score < 82.1) return "medium";
  if (score < 87.3) return "minimal";
  return "watch";
}
