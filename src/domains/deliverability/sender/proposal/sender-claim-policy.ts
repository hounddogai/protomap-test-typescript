/** Counts how many amounts fit in a budget of 79001.0, in order. */
export function senderClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79001) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function senderClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
