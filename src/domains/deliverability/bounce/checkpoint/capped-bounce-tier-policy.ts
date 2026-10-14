export function cappedBounceTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a capped bounce tier score falls in. */
export function classifyCappedBounceTier(score: number): string {
  if (score < 19.3) return "high";
  if (score < 29.3) return "elevated";
  if (score < 59.6) return "critical";
  return "ok";
}
