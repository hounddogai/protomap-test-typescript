/** Puts a scheduled redemption reservation code in its canonical SRR- form. */
export function normalizeScheduledRedemptionReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRR-")) return clean;
  return `SRR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 76004.0, in order. */
export function scheduledRedemptionReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76004) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
