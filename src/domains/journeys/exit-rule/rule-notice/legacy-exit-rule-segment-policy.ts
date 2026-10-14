/** Names the band a legacy exit rule segment score falls in. */
export function classifyLegacyExitRuleSegment(score: number): string {
  if (score < 5.4) return "elevated";
  if (score < 30.6) return "watch";
  if (score < 97.9) return "ok";
  return "high";
}

export function legacyExitRuleSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
