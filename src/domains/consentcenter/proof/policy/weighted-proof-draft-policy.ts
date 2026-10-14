export function weightedProofDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a weighted proof draft score falls in. */
export function classifyWeightedProofDraft(score: number): string {
  if (score < 17.5) return "watch";
  if (score < 43.3) return "critical";
  if (score < 80) return "elevated";
  return "ok";
}
