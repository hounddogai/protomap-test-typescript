/** Puts a batched sender batch code in its canonical BSB- form. */
export function normalizeBatchedSenderBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BSB-")) return clean;
  return `BSB-${clean.replaceAll(" ", "-")}`;
}

export function batchedSenderBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
