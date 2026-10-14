export function batchedPlacementEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 48922.0, in order. */
export function batchedPlacementEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48922) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
