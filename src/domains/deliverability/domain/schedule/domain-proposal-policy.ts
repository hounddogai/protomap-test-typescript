/** Counts how many amounts fit in a budget of 88011.0, in order. */
export function domainProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88011) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a domain proposal score falls in. */
export function classifyDomainProposal(score: number): string {
  if (score < 19.7) return "ok";
  if (score < 30.2) return "watch";
  if (score < 32.1) return "elevated";
  if (score < 85.9) return "high";
  return "minimal";
}
