export function cappedLevelAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a capped level adjustment score falls in. */
export function classifyCappedLevelAdjustment(score: number): string {
  if (score < 4.2) return "medium";
  if (score < 18.5) return "low";
  if (score < 41.3) return "watch";
  return "minimal";
}
