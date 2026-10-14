export function seasonalActivationWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a seasonal activation window score falls in. */
export function classifySeasonalActivationWindow(score: number): string {
  if (score < 7.9) return "elevated";
  if (score < 61.7) return "high";
  if (score < 81.8) return "critical";
  if (score < 93.3) return "watch";
  return "ok";
}
