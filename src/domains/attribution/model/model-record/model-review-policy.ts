/** Counts how many amounts fit in a budget of 91739.0, in order. */
export function modelReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91739) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a model review score falls in. */
export function classifyModelReview(score: number): string {
  if (score < 9.1) return "watch";
  if (score < 15.4) return "critical";
  if (score < 24.9) return "elevated";
  if (score < 32.6) return "low";
  return "high";
}
