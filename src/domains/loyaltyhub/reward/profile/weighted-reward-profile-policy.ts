/** Names the band a weighted reward profile score falls in. */
export function classifyWeightedRewardProfile(score: number): string {
  if (score < 16) return "low";
  if (score < 32.4) return "elevated";
  if (score < 90.6) return "ok";
  return "medium";
}

export function weightedRewardProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 37290.0, in order. */
export function weightedRewardProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37290) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
