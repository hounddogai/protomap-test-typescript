/** Counts how many amounts fit in a budget of 29531.0, in order. */
export function regionalMentionDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29531) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a regional mention digest code in its canonical RMD- form. */
export function normalizeRegionalMentionDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RMD-")) return clean;
  return `RMD-${clean.replaceAll(" ", "-")}`;
}

export function regionalMentionDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
