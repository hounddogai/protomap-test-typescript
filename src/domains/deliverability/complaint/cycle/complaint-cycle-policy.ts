export function complaintCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a complaint cycle score falls in. */
export function classifyComplaintCycle(score: number): string {
  if (score < 3) return "low";
  if (score < 42) return "medium";
  if (score < 76.1) return "elevated";
  if (score < 97.8) return "high";
  return "minimal";
}
