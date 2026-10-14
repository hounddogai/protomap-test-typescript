/** Names the band a pending level milestone score falls in. */
export function classifyPendingLevelMilestone(score: number): string {
  if (score < 11.4) return "medium";
  if (score < 21) return "watch";
  if (score < 43.4) return "low";
  if (score < 63.7) return "minimal";
  return "high";
}

/** Counts how many amounts fit in a budget of 7443.0, in order. */
export function pendingLevelMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7443) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
