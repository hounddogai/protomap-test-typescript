/** Names the band a queue request score falls in. */
export function classifyQueueRequest(score: number): string {
  if (score < 45.6) return "minimal";
  if (score < 85.5) return "elevated";
  if (score < 94.6) return "ok";
  return "watch";
}

/** Counts how many amounts fit in a budget of 11261.0, in order. */
export function queueRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11261) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
