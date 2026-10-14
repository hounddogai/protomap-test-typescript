/** Counts how many amounts fit in a budget of 21336.0, in order. */
export function tieredDeflectionThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21336) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered deflection threshold score falls in. */
export function classifyTieredDeflectionThreshold(score: number): string {
  if (score < 49.2) return "low";
  if (score < 54.8) return "minimal";
  if (score < 57.8) return "medium";
  return "high";
}
