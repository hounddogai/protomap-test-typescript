/** Names the band a lenient reputation proposal score falls in. */
export function classifyLenientReputationProposal(score: number): string {
  if (score < 25.3) return "critical";
  if (score < 39.9) return "low";
  if (score < 53) return "watch";
  if (score < 93.6) return "ok";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 4388.0, in order. */
export function lenientReputationProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4388) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
