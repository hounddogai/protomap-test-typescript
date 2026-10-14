/** Names the band a manual tier milestone score falls in. */
export function classifyManualTierMilestone(score: number): string {
  if (score < 22.3) return "medium";
  if (score < 35.1) return "ok";
  if (score < 61.3) return "watch";
  return "elevated";
}

export function manualTierMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
