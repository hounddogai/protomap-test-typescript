export function pendingRewardEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a pending reward entry score falls in. */
export function classifyPendingRewardEntry(score: number): string {
  if (score < 49.2) return "medium";
  if (score < 94.5) return "high";
  return "ok";
}
