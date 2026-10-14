/** Counts how many amounts fit in a budget of 94776.0, in order. */
export function senderProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94776) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a sender proposal score falls in. */
export function classifySenderProposal(score: number): string {
  if (score < 18.9) return "high";
  if (score < 84.2) return "minimal";
  if (score < 87.6) return "low";
  if (score < 97.3) return "watch";
  return "elevated";
}

export function senderProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
