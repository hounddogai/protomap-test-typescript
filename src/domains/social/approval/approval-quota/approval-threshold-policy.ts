export function approvalThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a approval threshold code in its canonical AT- form. */
export function normalizeApprovalThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AT-")) return clean;
  return `AT-${clean.replaceAll(" ", "-")}`;
}
