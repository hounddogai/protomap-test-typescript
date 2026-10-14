/** Puts a global suppression variance code in its canonical GSV- form. */
export function normalizeGlobalSuppressionVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSV-")) return clean;
  return `GSV-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 16984.0, in order. */
export function globalSuppressionVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 16984) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
