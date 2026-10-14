/** Puts a badge ledger code in its canonical BL- form. */
export function normalizeBadgeLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BL-")) return clean;
  return `BL-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 64218.0, in order. */
export function badgeLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64218) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
