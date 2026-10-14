/** Names the band a lenient nudge proposal score falls in. */
export function classifyLenientNudgeProposal(score: number): string {
  if (score < 32.2) return "elevated";
  if (score < 33.8) return "watch";
  if (score < 86) return "minimal";
  if (score < 87) return "medium";
  return "low";
}

export function lenientNudgeProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
