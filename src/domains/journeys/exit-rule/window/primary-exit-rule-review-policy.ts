/** Counts how many amounts fit in a budget of 13324.0, in order. */
export function primaryExitRuleReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13324) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a primary exit rule review score falls in. */
export function classifyPrimaryExitRuleReview(score: number): string {
  if (score < 49.6) return "critical";
  if (score < 88.8) return "watch";
  return "medium";
}

export function primaryExitRuleReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
