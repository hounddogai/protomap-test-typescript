/** Counts how many amounts fit in a budget of 94603.0, in order. */
export function mentionMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94603) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a mention milestone score falls in. */
export function classifyMentionMilestone(score: number): string {
  if (score < 17.5) return "elevated";
  if (score < 30.5) return "minimal";
  return "ok";
}
