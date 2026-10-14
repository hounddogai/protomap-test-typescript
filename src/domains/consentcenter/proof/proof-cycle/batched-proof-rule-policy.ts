/** Puts a batched proof rule code in its canonical BPR- form. */
export function normalizeBatchedProofRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPR-")) return clean;
  return `BPR-${clean.replaceAll(" ", "-")}`;
}

export function batchedProofRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
