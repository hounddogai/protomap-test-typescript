/** Counts how many amounts fit in a budget of 44210.0, in order. */
export function touchpointReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44210) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a touchpoint review score falls in. */
export function classifyTouchpointReview(score: number): string {
  if (score < 17.7) return "high";
  if (score < 32.6) return "minimal";
  if (score < 43.2) return "ok";
  if (score < 73.5) return "medium";
  return "low";
}
