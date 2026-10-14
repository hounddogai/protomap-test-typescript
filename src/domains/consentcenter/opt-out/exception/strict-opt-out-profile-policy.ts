export function strictOptOutProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a strict opt out profile score falls in. */
export function classifyStrictOptOutProfile(score: number): string {
  if (score < 67) return "critical";
  if (score < 79.7) return "elevated";
  if (score < 90.6) return "minimal";
  return "low";
}
