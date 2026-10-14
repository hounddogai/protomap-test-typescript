/** Puts a seasonal warmup budget code in its canonical SWB- form. */
export function normalizeSeasonalWarmupBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWB-")) return clean;
  return `SWB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal warmup budget score falls in. */
export function classifySeasonalWarmupBudget(score: number): string {
  if (score < 8.2) return "medium";
  if (score < 19.7) return "high";
  if (score < 57.9) return "elevated";
  return "low";
}

/** Counts how many amounts fit in a budget of 8120.0, in order. */
export function seasonalWarmupBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8120) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
