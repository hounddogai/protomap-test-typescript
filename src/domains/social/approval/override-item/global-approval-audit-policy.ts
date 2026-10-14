export function globalApprovalAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a global approval audit score falls in. */
export function classifyGlobalApprovalAudit(score: number): string {
  if (score < 34.9) return "critical";
  if (score < 36.2) return "minimal";
  if (score < 41.4) return "elevated";
  if (score < 59.8) return "watch";
  return "ok";
}
