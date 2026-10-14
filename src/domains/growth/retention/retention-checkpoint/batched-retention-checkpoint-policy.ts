/** Names the band a batched retention checkpoint score falls in. */
export function classifyBatchedRetentionCheckpoint(score: number): string {
  if (score < 56.1) return "minimal";
  if (score < 64.1) return "critical";
  if (score < 78.8) return "elevated";
  return "ok";
}

/** Puts a batched retention checkpoint code in its canonical BRC- form. */
export function normalizeBatchedRetentionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRC-")) return clean;
  return `BRC-${clean.replaceAll(" ", "-")}`;
}

export function batchedRetentionCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
