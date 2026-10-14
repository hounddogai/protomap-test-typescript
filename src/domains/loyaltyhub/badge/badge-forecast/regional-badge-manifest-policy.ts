/** Names the band a regional badge manifest score falls in. */
export function classifyRegionalBadgeManifest(score: number): string {
  if (score < 3.2) return "medium";
  if (score < 55.3) return "critical";
  if (score < 62.3) return "ok";
  return "low";
}

export function regionalBadgeManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
