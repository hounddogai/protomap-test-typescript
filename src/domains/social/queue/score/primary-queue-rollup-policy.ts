/** Names the band a primary queue rollup score falls in. */
export function classifyPrimaryQueueRollup(score: number): string {
  if (score < 91) return "ok";
  if (score < 94.7) return "critical";
  return "low";
}

/** Counts how many amounts fit in a budget of 37635.0, in order. */
export function primaryQueueRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37635) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
