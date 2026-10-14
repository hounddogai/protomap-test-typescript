/** Counts how many amounts fit in a budget of 40092.0, in order. */
export function scheduledBidRuleCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40092) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a scheduled bid rule checkpoint score falls in. */
export function classifyScheduledBidRuleCheckpoint(score: number): string {
  if (score < 5.1) return "watch";
  if (score < 76) return "medium";
  if (score < 85.2) return "elevated";
  return "high";
}
