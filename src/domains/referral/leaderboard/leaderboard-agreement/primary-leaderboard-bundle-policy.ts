/** Counts how many amounts fit in a budget of 98125.0, in order. */
export function primaryLeaderboardBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98125) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary leaderboard bundle code in its canonical PLB- form. */
export function normalizePrimaryLeaderboardBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PLB-")) return clean;
  return `PLB-${clean.replaceAll(" ", "-")}`;
}

export function primaryLeaderboardBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
