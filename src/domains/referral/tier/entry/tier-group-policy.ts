export function tierGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a tier group score falls in. */
export function classifyTierGroup(score: number): string {
  if (score < 4.7) return "ok";
  if (score < 64.9) return "medium";
  if (score < 98.5) return "elevated";
  return "high";
}
