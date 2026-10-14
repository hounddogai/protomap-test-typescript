/** Counts how many amounts fit in a budget of 15658.0, in order. */
export function tieredSuppressionCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 15658) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered suppression checkpoint score falls in. */
export function classifyTieredSuppressionCheckpoint(score: number): string {
  if (score < 53) return "watch";
  if (score < 93.4) return "low";
  return "high";
}
