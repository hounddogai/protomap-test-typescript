export function defaultJourneyScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a default journey score score falls in. */
export function classifyDefaultJourneyScore(score: number): string {
  if (score < 10.3) return "critical";
  if (score < 42.3) return "high";
  if (score < 64.8) return "ok";
  if (score < 83.2) return "minimal";
  return "watch";
}
