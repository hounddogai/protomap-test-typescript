/** Names the band a rolling level cycle score falls in. */
export function classifyRollingLevelCycle(score: number): string {
  if (score < 49.1) return "critical";
  if (score < 56.6) return "elevated";
  return "ok";
}

export function rollingLevelCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
