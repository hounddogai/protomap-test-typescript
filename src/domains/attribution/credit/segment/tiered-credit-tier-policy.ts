/** Names the band a tiered credit tier score falls in. */
export function classifyTieredCreditTier(score: number): string {
  if (score < 49.3) return "minimal";
  if (score < 49.9) return "ok";
  return "high";
}

export function tieredCreditTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
