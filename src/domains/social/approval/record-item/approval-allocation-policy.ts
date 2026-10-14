/** Counts how many amounts fit in a budget of 47622.0, in order. */
export function approvalAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47622) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a approval allocation score falls in. */
export function classifyApprovalAllocation(score: number): string {
  if (score < 21) return "minimal";
  if (score < 41.1) return "high";
  if (score < 57) return "low";
  if (score < 74.2) return "medium";
  return "ok";
}
