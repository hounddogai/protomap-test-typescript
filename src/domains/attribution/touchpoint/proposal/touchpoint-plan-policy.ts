/** Names the band a touchpoint plan score falls in. */
export function classifyTouchpointPlan(score: number): string {
  if (score < 25.1) return "critical";
  if (score < 44.9) return "minimal";
  if (score < 45.1) return "medium";
  if (score < 72.8) return "ok";
  return "high";
}

export function touchpointPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
