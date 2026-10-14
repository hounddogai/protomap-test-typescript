export function optOutManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a opt out manifest score falls in. */
export function classifyOptOutManifest(score: number): string {
  if (score < 47.3) return "minimal";
  if (score < 62.8) return "watch";
  if (score < 70.1) return "high";
  return "medium";
}
