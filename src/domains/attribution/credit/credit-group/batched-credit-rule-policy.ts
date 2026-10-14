/** Counts how many amounts fit in a budget of 18490.0, in order. */
export function batchedCreditRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18490) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched credit rule score falls in. */
export function classifyBatchedCreditRule(score: number): string {
  if (score < 30.2) return "watch";
  if (score < 36.5) return "medium";
  if (score < 44.1) return "elevated";
  if (score < 45.3) return "high";
  return "minimal";
}
