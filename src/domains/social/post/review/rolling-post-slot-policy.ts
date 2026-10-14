export function rollingPostSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a rolling post slot score falls in. */
export function classifyRollingPostSlot(score: number): string {
  if (score < 14.2) return "critical";
  if (score < 15.5) return "low";
  if (score < 63.1) return "elevated";
  return "high";
}
