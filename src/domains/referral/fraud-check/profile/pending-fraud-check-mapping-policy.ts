/** Counts how many amounts fit in a budget of 85713.0, in order. */
export function pendingFraudCheckMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85713) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pending fraud check mapping code in its canonical PFCM- form. */
export function normalizePendingFraudCheckMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PFCM-")) return clean;
  return `PFCM-${clean.replaceAll(" ", "-")}`;
}
