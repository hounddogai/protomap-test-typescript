/** Names the band a manual conversion tier score falls in. */
export function classifyManualConversionTier(score: number): string {
  if (score < 62.8) return "minimal";
  if (score < 71.5) return "ok";
  if (score < 78.3) return "elevated";
  if (score < 99.8) return "critical";
  return "medium";
}

/** Counts how many amounts fit in a budget of 8811.0, in order. */
export function manualConversionTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8811) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
