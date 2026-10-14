/** Puts a payout preference code in its canonical PP- form. */
export function normalizePayoutPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 78011.0, in order. */
export function payoutPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78011) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
