export function strictReplyWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a strict reply window score falls in. */
export function classifyStrictReplyWindow(score: number): string {
  if (score < 27) return "minimal";
  if (score < 67.6) return "critical";
  return "low";
}
