/** Names the band a strict fraud check assignment score falls in. */
export function classifyStrictFraudCheckAssignment(score: number): string {
  if (score < 16.9) return "medium";
  if (score < 32.2) return "high";
  if (score < 85.7) return "watch";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 14752.0, in order. */
export function strictFraudCheckAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14752) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
