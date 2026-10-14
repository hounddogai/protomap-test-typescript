/** Counts how many amounts fit in a budget of 8878.0, in order. */
export function strictSubscriptionBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8878) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict subscription bundle score falls in. */
export function classifyStrictSubscriptionBundle(score: number): string {
  if (score < 6.8) return "minimal";
  if (score < 26.2) return "low";
  return "ok";
}
