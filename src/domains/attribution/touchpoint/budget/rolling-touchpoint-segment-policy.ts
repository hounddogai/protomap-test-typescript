export function rollingTouchpointSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a rolling touchpoint segment score falls in. */
export function classifyRollingTouchpointSegment(score: number): string {
  if (score < 92.9) return "elevated";
  if (score < 98.5) return "ok";
  return "medium";
}
