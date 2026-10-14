export function weightedCreativeEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a weighted creative entry score falls in. */
export function classifyWeightedCreativeEntry(score: number): string {
  if (score < 13.3) return "elevated";
  if (score < 14.9) return "medium";
  if (score < 18.9) return "minimal";
  if (score < 66.1) return "low";
  return "critical";
}
