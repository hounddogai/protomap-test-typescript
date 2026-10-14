/** Counts how many amounts fit in a budget of 59619.0, in order. */
export function primaryNudgeDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59619) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary nudge digest code in its canonical PND- form. */
export function normalizePrimaryNudgeDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PND-")) return clean;
  return `PND-${clean.replaceAll(" ", "-")}`;
}

export function primaryNudgeDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
