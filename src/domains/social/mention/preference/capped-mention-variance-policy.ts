/** Names the band a capped mention variance score falls in. */
export function classifyCappedMentionVariance(score: number): string {
  if (score < 15.4) return "high";
  if (score < 19.3) return "ok";
  if (score < 54.8) return "low";
  if (score < 55.6) return "elevated";
  return "watch";
}

export function cappedMentionVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
