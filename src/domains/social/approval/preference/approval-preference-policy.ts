export function approvalPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a approval preference score falls in. */
export function classifyApprovalPreference(score: number): string {
  if (score < 24.8) return "watch";
  if (score < 33.1) return "ok";
  if (score < 84.7) return "minimal";
  return "critical";
}
