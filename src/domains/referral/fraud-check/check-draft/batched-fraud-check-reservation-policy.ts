/** Counts how many amounts fit in a budget of 24255.0, in order. */
export function batchedFraudCheckReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24255) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a batched fraud check reservation code in its canonical BFCR- form. */
export function normalizeBatchedFraudCheckReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BFCR-")) return clean;
  return `BFCR-${clean.replaceAll(" ", "-")}`;
}
