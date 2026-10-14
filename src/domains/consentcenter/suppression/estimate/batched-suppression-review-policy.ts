export function batchedSuppressionReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 21699.0, in order. */
export function batchedSuppressionReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21699) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched suppression review score falls in. */
export function classifyBatchedSuppressionReview(score: number): string {
  if (score < 17) return "minimal";
  if (score < 87.2) return "low";
  if (score < 99.6) return "medium";
  return "watch";
}
