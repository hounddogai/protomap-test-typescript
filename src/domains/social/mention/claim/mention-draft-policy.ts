export function mentionDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a mention draft score falls in. */
export function classifyMentionDraft(score: number): string {
  if (score < 9.3) return "elevated";
  if (score < 29.7) return "medium";
  if (score < 66) return "watch";
  return "critical";
}
