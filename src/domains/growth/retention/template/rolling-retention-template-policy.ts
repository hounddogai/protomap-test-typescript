/** Names the band a rolling retention template score falls in. */
export function classifyRollingRetentionTemplate(score: number): string {
  if (score < 50) return "high";
  if (score < 94.7) return "medium";
  return "minimal";
}

export function rollingRetentionTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
