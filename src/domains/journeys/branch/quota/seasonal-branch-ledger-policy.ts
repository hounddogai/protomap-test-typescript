/** Puts a seasonal branch ledger code in its canonical SBL- form. */
export function normalizeSeasonalBranchLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBL-")) return clean;
  return `SBL-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 34908.0, in order. */
export function seasonalBranchLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34908) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
