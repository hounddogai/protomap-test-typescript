/** Names the band a tiered level reservation score falls in. */
export function classifyTieredLevelReservation(score: number): string {
  if (score < 52.6) return "elevated";
  if (score < 65.4) return "critical";
  if (score < 83.7) return "ok";
  if (score < 83.9) return "minimal";
  return "medium";
}

export function tieredLevelReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
