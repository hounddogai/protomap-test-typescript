export function fallbackPathMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a fallback path metric score falls in. */
export function classifyFallbackPathMetric(score: number): string {
  if (score < 8.7) return "low";
  if (score < 55.2) return "medium";
  return "watch";
}
