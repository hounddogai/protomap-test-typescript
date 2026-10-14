/** Names the band a pending exit rule item score falls in. */
export function classifyPendingExitRuleItem(score: number): string {
  if (score < 20.5) return "critical";
  if (score < 98.5) return "elevated";
  return "medium";
}

/** Counts how many amounts fit in a budget of 68075.0, in order. */
export function pendingExitRuleItemBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68075) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
