/** Counts how many amounts fit in a budget of 55015.0, in order. */
export function deflectionForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55015) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function deflectionForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
