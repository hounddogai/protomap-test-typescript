/** Names the band a adaptive credit notice score falls in. */
export function classifyAdaptiveCreditNotice(score: number): string {
  if (score < 40.7) return "low";
  if (score < 47.9) return "ok";
  if (score < 69.7) return "critical";
  if (score < 91.4) return "watch";
  return "high";
}

export function adaptiveCreditNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
