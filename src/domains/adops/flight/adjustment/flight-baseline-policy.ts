/** Names the band a flight baseline score falls in. */
export function classifyFlightBaseline(score: number): string {
  if (score < 17.1) return "critical";
  if (score < 24.4) return "watch";
  return "low";
}

export function flightBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
