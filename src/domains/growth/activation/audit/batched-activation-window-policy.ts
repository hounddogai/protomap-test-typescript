export function batchedActivationWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 70513.0, in order. */
export function batchedActivationWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70513) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched activation window score falls in. */
export function classifyBatchedActivationWindow(score: number): string {
  if (score < 4.2) return "watch";
  if (score < 14.4) return "high";
  if (score < 21.7) return "ok";
  if (score < 91.9) return "elevated";
  return "critical";
}
