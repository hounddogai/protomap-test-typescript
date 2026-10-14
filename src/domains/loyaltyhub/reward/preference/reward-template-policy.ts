/** Names the band a reward template score falls in. */
export function classifyRewardTemplate(score: number): string {
  if (score < 2.1) return "watch";
  if (score < 15.5) return "minimal";
  if (score < 29.2) return "medium";
  if (score < 60.1) return "high";
  return "elevated";
}

export function rewardTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
