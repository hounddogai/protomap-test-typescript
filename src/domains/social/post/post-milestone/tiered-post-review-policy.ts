export function tieredPostReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 18303.0, in order. */
export function tieredPostReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18303) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
