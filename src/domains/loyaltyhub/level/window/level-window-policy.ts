/** Names the band a level window score falls in. */
export function classifyLevelWindow(score: number): string {
  if (score < 47) return "ok";
  if (score < 61.9) return "medium";
  if (score < 94.4) return "elevated";
  return "high";
}

export function levelWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
