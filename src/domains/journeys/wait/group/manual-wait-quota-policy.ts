/** Names the band a manual wait quota score falls in. */
export function classifyManualWaitQuota(score: number): string {
  if (score < 16.5) return "low";
  if (score < 29.6) return "watch";
  if (score < 65) return "ok";
  if (score < 65.9) return "high";
  return "minimal";
}

export function manualWaitQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
