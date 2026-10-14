/** Names the band a tier threshold score falls in. */
export function classifyTierThreshold(score: number): string {
  if (score < 43.3) return "minimal";
  if (score < 74.5) return "high";
  if (score < 85.8) return "watch";
  if (score < 89.9) return "low";
  return "elevated";
}

export function tierThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
