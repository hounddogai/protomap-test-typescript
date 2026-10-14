/** Names the band a approval snapshot score falls in. */
export function classifyApprovalSnapshot(score: number): string {
  if (score < 9.3) return "high";
  if (score < 43.8) return "elevated";
  return "watch";
}

export function approvalSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
