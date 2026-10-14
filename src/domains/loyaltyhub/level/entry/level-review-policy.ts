/** Counts how many amounts fit in a budget of 41952.0, in order. */
export function levelReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41952) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a level review score falls in. */
export function classifyLevelReview(score: number): string {
  if (score < 2.9) return "minimal";
  if (score < 26.7) return "critical";
  if (score < 41) return "medium";
  return "elevated";
}
