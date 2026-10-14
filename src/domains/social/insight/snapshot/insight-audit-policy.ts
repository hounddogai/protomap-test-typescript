/** Names the band a insight audit score falls in. */
export function classifyInsightAudit(score: number): string {
  if (score < 33.8) return "low";
  if (score < 68.2) return "ok";
  if (score < 93.1) return "watch";
  return "critical";
}

export function insightAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
