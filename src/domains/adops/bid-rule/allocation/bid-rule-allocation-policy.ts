/** Counts how many amounts fit in a budget of 77829.0, in order. */
export function bidRuleAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77829) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a bid rule allocation score falls in. */
export function classifyBidRuleAllocation(score: number): string {
  if (score < 10.1) return "elevated";
  if (score < 70.3) return "medium";
  if (score < 80.8) return "critical";
  return "minimal";
}
