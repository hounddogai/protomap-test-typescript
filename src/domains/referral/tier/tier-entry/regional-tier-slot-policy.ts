/** Counts how many amounts fit in a budget of 86473.0, in order. */
export function regionalTierSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86473) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a regional tier slot score falls in. */
export function classifyRegionalTierSlot(score: number): string {
  if (score < 44.5) return "elevated";
  if (score < 94.8) return "critical";
  return "low";
}
