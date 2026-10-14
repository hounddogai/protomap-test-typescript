/** Names the band a suppression estimate score falls in. */
export function classifySuppressionEstimate(score: number): string {
  if (score < 19.2) return "elevated";
  if (score < 24.7) return "low";
  if (score < 32.7) return "watch";
  if (score < 34.6) return "critical";
  return "high";
}

export function suppressionEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
