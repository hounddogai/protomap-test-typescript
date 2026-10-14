/** Counts how many amounts fit in a budget of 92995.0, in order. */
export function placementMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92995) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a placement milestone score falls in. */
export function classifyPlacementMilestone(score: number): string {
  if (score < 12.9) return "high";
  if (score < 84.1) return "medium";
  return "watch";
}
