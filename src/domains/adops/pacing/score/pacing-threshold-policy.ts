/** Names the band a pacing threshold score falls in. */
export function classifyPacingThreshold(score: number): string {
  if (score < 4) return "low";
  if (score < 45.9) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 28838.0, in order. */
export function pacingThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 28838) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
