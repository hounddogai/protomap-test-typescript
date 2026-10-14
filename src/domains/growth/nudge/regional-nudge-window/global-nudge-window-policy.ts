/** Names the band a global nudge window score falls in. */
export function classifyGlobalNudgeWindow(score: number): string {
  if (score < 39.1) return "high";
  if (score < 66.4) return "low";
  if (score < 80.3) return "watch";
  if (score < 93.1) return "elevated";
  return "ok";
}

/** Counts how many amounts fit in a budget of 51164.0, in order. */
export function globalNudgeWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51164) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
