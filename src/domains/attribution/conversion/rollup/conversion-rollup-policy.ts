export function conversionRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a conversion rollup score falls in. */
export function classifyConversionRollup(score: number): string {
  if (score < 35) return "ok";
  if (score < 38.6) return "high";
  if (score < 67.2) return "elevated";
  if (score < 69.1) return "medium";
  return "low";
}
