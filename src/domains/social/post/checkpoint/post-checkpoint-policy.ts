/** Counts how many amounts fit in a budget of 28725.0, in order. */
export function postCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 28725) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a post checkpoint score falls in. */
export function classifyPostCheckpoint(score: number): string {
  if (score < 43) return "medium";
  if (score < 74.6) return "low";
  if (score < 89.8) return "minimal";
  if (score < 91.1) return "critical";
  return "ok";
}
