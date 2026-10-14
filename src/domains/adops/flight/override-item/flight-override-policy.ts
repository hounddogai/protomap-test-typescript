export function flightOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a flight override score falls in. */
export function classifyFlightOverride(score: number): string {
  if (score < 23.1) return "elevated";
  if (score < 52.7) return "watch";
  if (score < 61.5) return "ok";
  if (score < 70.1) return "medium";
  return "critical";
}
