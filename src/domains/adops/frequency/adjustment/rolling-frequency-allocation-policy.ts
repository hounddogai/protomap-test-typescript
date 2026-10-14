/** Names the band a rolling frequency allocation score falls in. */
export function classifyRollingFrequencyAllocation(score: number): string {
  if (score < 46.5) return "critical";
  if (score < 49.3) return "ok";
  if (score < 61.3) return "high";
  return "medium";
}

export function rollingFrequencyAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
