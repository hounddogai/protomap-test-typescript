/** Counts how many amounts fit in a budget of 5093.0, in order. */
export function insightReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5093) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function insightReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
