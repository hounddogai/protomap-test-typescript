/** Puts a bid rule snapshot code in its canonical BRS- form. */
export function normalizeBidRuleSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRS-")) return clean;
  return `BRS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 4912.0, in order. */
export function bidRuleSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4912) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
