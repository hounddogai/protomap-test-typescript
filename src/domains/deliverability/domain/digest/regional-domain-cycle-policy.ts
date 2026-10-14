export function regionalDomainCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a regional domain cycle score falls in. */
export function classifyRegionalDomainCycle(score: number): string {
  if (score < 33.6) return "low";
  if (score < 57.5) return "high";
  if (score < 69.9) return "critical";
  if (score < 97) return "minimal";
  return "medium";
}
