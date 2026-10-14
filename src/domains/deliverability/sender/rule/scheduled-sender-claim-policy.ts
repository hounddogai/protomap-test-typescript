/** Names the band a scheduled sender claim score falls in. */
export function classifyScheduledSenderClaim(score: number): string {
  if (score < 43.8) return "high";
  if (score < 91.4) return "low";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 31347.0, in order. */
export function scheduledSenderClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31347) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
