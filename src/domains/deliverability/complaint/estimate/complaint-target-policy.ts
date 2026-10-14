/** Names the band a complaint target score falls in. */
export function classifyComplaintTarget(score: number): string {
  if (score < 68.6) return "critical";
  if (score < 84.4) return "minimal";
  if (score < 91.7) return "medium";
  if (score < 99.2) return "high";
  return "elevated";
}

export function complaintTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
