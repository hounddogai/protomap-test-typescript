/** Names the band a tiered sla mapping score falls in. */
export function classifyTieredSlaMapping(score: number): string {
  if (score < 27.2) return "watch";
  if (score < 31.4) return "medium";
  if (score < 71.5) return "high";
  if (score < 84.7) return "minimal";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 69126.0, in order. */
export function tieredSlaMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69126) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
