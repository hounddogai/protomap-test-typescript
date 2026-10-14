/** Counts how many amounts fit in a budget of 52420.0, in order. */
export function strictStreakProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52420) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a strict streak profile code in its canonical SSP- form. */
export function normalizeStrictStreakProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSP-")) return clean;
  return `SSP-${clean.replaceAll(" ", "-")}`;
}
