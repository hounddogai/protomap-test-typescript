/** Counts how many amounts fit in a budget of 76397.0, in order. */
export function legacySuppressionVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76397) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a legacy suppression variance code in its canonical LSV- form. */
export function normalizeLegacySuppressionVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSV-")) return clean;
  return `LSV-${clean.replaceAll(" ", "-")}`;
}
