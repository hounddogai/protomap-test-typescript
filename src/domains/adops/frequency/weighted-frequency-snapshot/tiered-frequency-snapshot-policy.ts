/** Names the band a tiered frequency snapshot score falls in. */
export function classifyTieredFrequencySnapshot(score: number): string {
  if (score < 23) return "minimal";
  if (score < 36.2) return "ok";
  if (score < 66.6) return "medium";
  return "high";
}

export function tieredFrequencySnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
