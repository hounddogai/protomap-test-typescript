/** Puts a warmup summary code in its canonical WS- form. */
export function normalizeWarmupSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WS-")) return clean;
  return `WS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 25026.0, in order. */
export function warmupSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25026) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
