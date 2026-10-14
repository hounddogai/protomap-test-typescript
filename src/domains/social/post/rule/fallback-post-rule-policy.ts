/** Counts how many amounts fit in a budget of 69340.0, in order. */
export function fallbackPostRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69340) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback post rule code in its canonical FPR- form. */
export function normalizeFallbackPostRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FPR-")) return clean;
  return `FPR-${clean.replaceAll(" ", "-")}`;
}

export function fallbackPostRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
