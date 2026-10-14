export function strictTierPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a strict tier policy score falls in. */
export function classifyStrictTierPolicy(score: number): string {
  if (score < 27) return "ok";
  if (score < 46) return "critical";
  return "minimal";
}
