export function regionalConversionScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a regional conversion score score falls in. */
export function classifyRegionalConversionScore(score: number): string {
  if (score < 16.6) return "elevated";
  if (score < 76.6) return "medium";
  if (score < 80.2) return "ok";
  return "watch";
}
