/** Puts a primary badge entry code in its canonical PBE- form. */
export function normalizePrimaryBadgeEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PBE-")) return clean;
  return `PBE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 40912.0, in order. */
export function primaryBadgeEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40912) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
