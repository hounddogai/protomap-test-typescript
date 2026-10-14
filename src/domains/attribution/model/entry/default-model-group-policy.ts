/** Names the band a default model group score falls in. */
export function classifyDefaultModelGroup(score: number): string {
  if (score < 35.8) return "ok";
  if (score < 52.1) return "high";
  if (score < 86.7) return "medium";
  return "critical";
}

/** Counts how many amounts fit in a budget of 3744.0, in order. */
export function defaultModelGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3744) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
