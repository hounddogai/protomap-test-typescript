export function pendingBranchManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a pending branch manifest score falls in. */
export function classifyPendingBranchManifest(score: number): string {
  if (score < 48.8) return "elevated";
  if (score < 82.6) return "high";
  return "watch";
}
