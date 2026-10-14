export function strictProofScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a strict proof schedule score falls in. */
export function classifyStrictProofSchedule(score: number): string {
  if (score < 31.7) return "critical";
  if (score < 84.9) return "medium";
  if (score < 95.6) return "minimal";
  return "ok";
}
