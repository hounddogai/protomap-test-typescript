/** Counts how many amounts fit in a budget of 11312.0, in order. */
export function weightedPlacementSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11312) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a weighted placement snapshot score falls in. */
export function classifyWeightedPlacementSnapshot(score: number): string {
  if (score < 9.5) return "high";
  if (score < 73) return "minimal";
  return "watch";
}
