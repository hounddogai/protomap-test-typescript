/** Names the band a journey threshold score falls in. */
export function classifyJourneyThreshold(score: number): string {
  if (score < 4.4) return "medium";
  if (score < 32.8) return "ok";
  if (score < 81.1) return "low";
  return "elevated";
}

export function journeyThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
