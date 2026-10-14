/** Puts a insight entry code in its canonical IE- form. */
export function normalizeInsightEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IE-")) return clean;
  return `IE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 21593.0, in order. */
export function insightEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21593) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
