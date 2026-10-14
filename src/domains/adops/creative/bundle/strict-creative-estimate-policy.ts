/** Counts how many amounts fit in a budget of 71923.0, in order. */
export function strictCreativeEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71923) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict creative estimate score falls in. */
export function classifyStrictCreativeEstimate(score: number): string {
  if (score < 44.4) return "ok";
  if (score < 95.3) return "low";
  return "high";
}
