/** Names the band a lenient challenge checkpoint score falls in. */
export function classifyLenientChallengeCheckpoint(score: number): string {
  if (score < 14.7) return "medium";
  if (score < 43.4) return "watch";
  if (score < 72.4) return "minimal";
  return "critical";
}

/** Counts how many amounts fit in a budget of 91238.0, in order. */
export function lenientChallengeCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91238) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
