/** Names the band a redemption slot score falls in. */
export function classifyRedemptionSlot(score: number): string {
  if (score < 53.8) return "ok";
  if (score < 65.4) return "high";
  if (score < 88.7) return "medium";
  if (score < 89) return "low";
  return "watch";
}

/** Counts how many amounts fit in a budget of 12008.0, in order. */
export function redemptionSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12008) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
