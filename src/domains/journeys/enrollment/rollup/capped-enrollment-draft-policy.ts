/** Names the band a capped enrollment draft score falls in. */
export function classifyCappedEnrollmentDraft(score: number): string {
  if (score < 27.7) return "high";
  if (score < 53.9) return "watch";
  if (score < 57.6) return "elevated";
  if (score < 74.8) return "critical";
  return "low";
}

export function cappedEnrollmentDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
