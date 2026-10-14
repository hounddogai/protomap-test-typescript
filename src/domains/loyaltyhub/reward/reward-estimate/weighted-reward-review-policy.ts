export function weightedRewardReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a weighted reward review score falls in. */
export function classifyWeightedRewardReview(score: number): string {
  if (score < 28.8) return "elevated";
  if (score < 37.6) return "ok";
  return "high";
}

/** Counts how many amounts fit in a budget of 18529.0, in order. */
export function weightedRewardReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18529) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
