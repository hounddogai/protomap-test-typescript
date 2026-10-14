/** Counts how many amounts fit in a budget of 73205.0, in order. */
export function cappedStreakReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73205) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped streak review score falls in. */
export function classifyCappedStreakReview(score: number): string {
  if (score < 8) return "high";
  if (score < 40.7) return "ok";
  if (score < 65.3) return "elevated";
  if (score < 85) return "low";
  return "minimal";
}
