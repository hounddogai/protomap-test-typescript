/** Puts a legacy badge notice code in its canonical LBN- form. */
export function normalizeLegacyBadgeNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LBN-")) return clean;
  return `LBN-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 18445.0, in order. */
export function legacyBadgeNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18445) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
