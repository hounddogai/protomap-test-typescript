/** Counts how many amounts fit in a budget of 97868.0, in order. */
export function streakRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97868) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a streak record score falls in. */
export function classifyStreakRecord(score: number): string {
  if (score < 46.6) return "medium";
  if (score < 68.4) return "elevated";
  return "high";
}
