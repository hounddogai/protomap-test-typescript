/** Counts how many amounts fit in a budget of 43203.0, in order. */
export function queuePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43203) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function queuePreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
