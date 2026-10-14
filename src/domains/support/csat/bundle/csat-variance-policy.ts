/** Counts how many amounts fit in a budget of 42216.0, in order. */
export function csatVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42216) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function csatVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
