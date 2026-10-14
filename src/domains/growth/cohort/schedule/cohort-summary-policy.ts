export function cohortSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a cohort summary score falls in. */
export function classifyCohortSummary(score: number): string {
  if (score < 43.8) return "elevated";
  if (score < 53) return "medium";
  if (score < 61.7) return "minimal";
  if (score < 96) return "critical";
  return "low";
}
