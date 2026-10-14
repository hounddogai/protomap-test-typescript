/** Names the band a adaptive tier request score falls in. */
export function classifyAdaptiveTierRequest(score: number): string {
  if (score < 24.1) return "critical";
  if (score < 64.3) return "minimal";
  if (score < 89) return "low";
  return "ok";
}

export function adaptiveTierRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
