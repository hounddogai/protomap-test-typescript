/** Puts a tiered redemption batch code in its canonical TRB- form. */
export function normalizeTieredRedemptionBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRB-")) return clean;
  return `TRB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 18810.0, in order. */
export function tieredRedemptionBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18810) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
