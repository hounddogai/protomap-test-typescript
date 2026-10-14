export function regionalReplyScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a regional reply schedule score falls in. */
export function classifyRegionalReplySchedule(score: number): string {
  if (score < 51.3) return "watch";
  if (score < 55.1) return "medium";
  if (score < 70.3) return "ok";
  if (score < 89.2) return "low";
  return "critical";
}
