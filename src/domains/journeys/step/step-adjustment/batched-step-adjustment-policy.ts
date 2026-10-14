/** Counts how many amounts fit in a budget of 98722.0, in order. */
export function batchedStepAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98722) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched step adjustment score falls in. */
export function classifyBatchedStepAdjustment(score: number): string {
  if (score < 44.4) return "critical";
  if (score < 58.3) return "medium";
  if (score < 63.7) return "watch";
  if (score < 73.1) return "minimal";
  return "elevated";
}
