/** Names the band a payout proposal score falls in. */
export function classifyPayoutProposal(score: number): string {
  if (score < 31.7) return "medium";
  if (score < 93.6) return "watch";
  return "high";
}

export function payoutProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
