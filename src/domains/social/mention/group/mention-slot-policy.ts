/** Names the band a mention slot score falls in. */
export function classifyMentionSlot(score: number): string {
  if (score < 41.6) return "low";
  if (score < 62.5) return "watch";
  return "critical";
}

export function mentionSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
