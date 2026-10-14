/** Counts how many amounts fit in a budget of 44434.0, in order. */
export function defaultActivationTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44434) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default activation target score falls in. */
export function classifyDefaultActivationTarget(score: number): string {
  if (score < 7.7) return "elevated";
  if (score < 43.5) return "watch";
  if (score < 64.1) return "medium";
  if (score < 79.5) return "low";
  return "ok";
}
