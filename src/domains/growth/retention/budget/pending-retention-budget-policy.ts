/** Counts how many amounts fit in a budget of 47253.0, in order. */
export function pendingRetentionBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47253) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pending retention budget score falls in. */
export function classifyPendingRetentionBudget(score: number): string {
  if (score < 34.6) return "ok";
  if (score < 54.1) return "elevated";
  if (score < 64) return "low";
  if (score < 65.5) return "critical";
  return "medium";
}
