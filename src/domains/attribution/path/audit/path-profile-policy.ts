/** Counts how many amounts fit in a budget of 10619.0, in order. */
export function pathProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10619) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a path profile code in its canonical PP- form. */
export function normalizePathProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

export function pathProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
