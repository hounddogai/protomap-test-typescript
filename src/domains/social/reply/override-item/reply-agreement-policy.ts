/** Names the band a reply agreement score falls in. */
export function classifyReplyAgreement(score: number): string {
  if (score < 39.6) return "critical";
  if (score < 46.3) return "elevated";
  return "minimal";
}

export function replyAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
