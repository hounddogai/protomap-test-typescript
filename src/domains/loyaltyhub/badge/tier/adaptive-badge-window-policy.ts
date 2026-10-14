export function adaptiveBadgeWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a adaptive badge window score falls in. */
export function classifyAdaptiveBadgeWindow(score: number): string {
  if (score < 16.5) return "critical";
  if (score < 48.8) return "watch";
  if (score < 63.4) return "elevated";
  return "medium";
}
