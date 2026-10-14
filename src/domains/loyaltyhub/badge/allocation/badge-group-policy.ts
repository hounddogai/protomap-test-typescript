export function badgeGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a badge group score falls in. */
export function classifyBadgeGroup(score: number): string {
  if (score < 59.8) return "minimal";
  if (score < 93.5) return "elevated";
  if (score < 94.4) return "watch";
  return "medium";
}
