/** Puts a batched invite entry code in its canonical BIE- form. */
export function normalizeBatchedInviteEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BIE-")) return clean;
  return `BIE-${clean.replaceAll(" ", "-")}`;
}

export function batchedInviteEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a batched invite entry score falls in. */
export function classifyBatchedInviteEntry(score: number): string {
  if (score < 28.5) return "critical";
  if (score < 45.5) return "medium";
  if (score < 48.1) return "watch";
  return "elevated";
}
