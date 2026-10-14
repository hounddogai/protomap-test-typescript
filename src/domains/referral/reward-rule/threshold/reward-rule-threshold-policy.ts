/** Names the band a reward rule threshold score falls in. */
export function classifyRewardRuleThreshold(score: number): string {
  if (score < 73.4) return "low";
  if (score < 74.9) return "elevated";
  if (score < 81.5) return "watch";
  if (score < 94.5) return "critical";
  return "high";
}

export function rewardRuleThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
