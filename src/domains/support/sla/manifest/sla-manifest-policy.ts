export function slaManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a sla manifest score falls in. */
export function classifySlaManifest(score: number): string {
  if (score < 25.4) return "watch";
  if (score < 52.4) return "ok";
  return "medium";
}
