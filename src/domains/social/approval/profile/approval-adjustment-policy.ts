export function approvalAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a approval adjustment code in its canonical AA- form. */
export function normalizeApprovalAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AA-")) return clean;
  return `AA-${clean.replaceAll(" ", "-")}`;
}
