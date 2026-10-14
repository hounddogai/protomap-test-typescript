/** Names the band a sla policy score falls in. */
export function classifySlaPolicy(score: number): string {
  if (score < 46.4) return "watch";
  if (score < 84.8) return "high";
  return "elevated";
}

export function slaPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
