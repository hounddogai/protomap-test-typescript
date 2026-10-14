export function conversionAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a conversion adjustment score falls in. */
export function classifyConversionAdjustment(score: number): string {
  if (score < 64.1) return "minimal";
  if (score < 66.6) return "elevated";
  if (score < 79.3) return "critical";
  return "ok";
}
