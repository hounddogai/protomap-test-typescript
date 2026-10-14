/** Counts how many amounts fit in a budget of 59504.0, in order. */
export function pacingSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59504) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pacingSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a pacing segment code in its canonical PS- form. */
export function normalizePacingSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PS-")) return clean;
  return `PS-${clean.replaceAll(" ", "-")}`;
}
