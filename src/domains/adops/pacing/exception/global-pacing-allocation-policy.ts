/** Names the band a global pacing allocation score falls in. */
export function classifyGlobalPacingAllocation(score: number): string {
  if (score < 33.6) return "high";
  if (score < 82.7) return "low";
  return "ok";
}

/** Counts how many amounts fit in a budget of 33307.0, in order. */
export function globalPacingAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33307) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
