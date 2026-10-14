/** Counts how many amounts fit in a budget of 44961.0, in order. */
export function strictPacingRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44961) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a strict pacing rollup code in its canonical SPR- form. */
export function normalizeStrictPacingRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPR-")) return clean;
  return `SPR-${clean.replaceAll(" ", "-")}`;
}
