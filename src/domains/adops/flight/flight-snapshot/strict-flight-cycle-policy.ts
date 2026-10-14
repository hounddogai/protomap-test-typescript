export function strictFlightCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a strict flight cycle score falls in. */
export function classifyStrictFlightCycle(score: number): string {
  if (score < 54.8) return "elevated";
  if (score < 67.1) return "minimal";
  if (score < 88.5) return "critical";
  return "ok";
}
