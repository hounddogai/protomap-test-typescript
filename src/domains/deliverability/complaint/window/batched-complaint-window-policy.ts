export function batchedComplaintWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a batched complaint window score falls in. */
export function classifyBatchedComplaintWindow(score: number): string {
  if (score < 21.2) return "watch";
  if (score < 41.2) return "minimal";
  if (score < 54.7) return "elevated";
  return "medium";
}
