/** Counts how many amounts fit in a budget of 4810.0, in order. */
export function pacingMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4810) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pacing milestone score falls in. */
export function classifyPacingMilestone(score: number): string {
  if (score < 14) return "critical";
  if (score < 82.5) return "medium";
  return "elevated";
}
