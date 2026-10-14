/** Counts how many amounts fit in a budget of 48301.0, in order. */
export function weightedJourneyBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48301) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a weighted journey batch code in its canonical WJB- form. */
export function normalizeWeightedJourneyBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WJB-")) return clean;
  return `WJB-${clean.replaceAll(" ", "-")}`;
}
