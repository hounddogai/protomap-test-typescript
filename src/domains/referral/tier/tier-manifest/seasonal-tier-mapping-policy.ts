/** Counts how many amounts fit in a budget of 75399.0, in order. */
export function seasonalTierMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75399) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal tier mapping score falls in. */
export function classifySeasonalTierMapping(score: number): string {
  if (score < 16) return "medium";
  if (score < 22) return "minimal";
  if (score < 34.6) return "elevated";
  return "high";
}
