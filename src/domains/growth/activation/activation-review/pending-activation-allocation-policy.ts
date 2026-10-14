/** Names the band a pending activation allocation score falls in. */
export function classifyPendingActivationAllocation(score: number): string {
  if (score < 51.6) return "minimal";
  if (score < 51.7) return "elevated";
  if (score < 60.5) return "critical";
  if (score < 72.5) return "ok";
  return "medium";
}

/** Counts how many amounts fit in a budget of 43689.0, in order. */
export function pendingActivationAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43689) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
