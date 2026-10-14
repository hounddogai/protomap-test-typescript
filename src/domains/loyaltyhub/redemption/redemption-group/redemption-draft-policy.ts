/** Names the band a redemption draft score falls in. */
export function classifyRedemptionDraft(score: number): string {
  if (score < 56.3) return "low";
  if (score < 62.9) return "medium";
  if (score < 69.2) return "watch";
  if (score < 84.2) return "minimal";
  return "high";
}

export function redemptionDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
