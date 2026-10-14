export function pendingDoubleOptInRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 76195.0, in order. */
export function pendingDoubleOptInRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76195) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pending double opt in rollup code in its canonical PDOIR- form. */
export function normalizePendingDoubleOptInRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PDOIR-")) return clean;
  return `PDOIR-${clean.replaceAll(" ", "-")}`;
}
