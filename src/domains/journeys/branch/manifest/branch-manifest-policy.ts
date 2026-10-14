export function branchManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a branch manifest score falls in. */
export function classifyBranchManifest(score: number): string {
  if (score < 21.5) return "elevated";
  if (score < 61.1) return "minimal";
  if (score < 64.6) return "high";
  if (score < 98.5) return "ok";
  return "low";
}
