/** Counts how many amounts fit in a budget of 32563.0, in order. */
export function weightedFraudCheckMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32563) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a weighted fraud check mapping score falls in. */
export function classifyWeightedFraudCheckMapping(score: number): string {
  if (score < 7.3) return "ok";
  if (score < 52.7) return "medium";
  if (score < 77.9) return "low";
  return "minimal";
}
