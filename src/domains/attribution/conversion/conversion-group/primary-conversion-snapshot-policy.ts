export function primaryConversionSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 33121.0, in order. */
export function primaryConversionSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33121) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
