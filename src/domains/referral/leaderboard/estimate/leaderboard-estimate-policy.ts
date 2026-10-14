export function leaderboardEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 64810.0, in order. */
export function leaderboardEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64810) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
