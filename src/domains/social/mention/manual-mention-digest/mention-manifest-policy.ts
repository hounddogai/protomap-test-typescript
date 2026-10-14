export function mentionManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a mention manifest score falls in. */
export function classifyMentionManifest(score: number): string {
  if (score < 56.4) return "minimal";
  if (score < 64) return "watch";
  if (score < 91.6) return "ok";
  return "critical";
}
