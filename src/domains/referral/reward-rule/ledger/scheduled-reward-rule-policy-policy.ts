export function scheduledRewardRulePolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a scheduled reward rule policy score falls in. */
export function classifyScheduledRewardRulePolicy(score: number): string {
  if (score < 45.3) return "elevated";
  if (score < 60.7) return "ok";
  if (score < 85.1) return "critical";
  return "minimal";
}
