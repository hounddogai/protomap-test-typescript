export function fraudCheckPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a fraud check preference score falls in. */
export function classifyFraudCheckPreference(score: number): string {
  if (score < 48.5) return "watch";
  if (score < 57.7) return "ok";
  if (score < 67.3) return "critical";
  return "low";
}
