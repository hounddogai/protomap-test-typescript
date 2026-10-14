/** Puts a fraud check notice code in its canonical FCN- form. */
export function normalizeFraudCheckNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCN-")) return clean;
  return `FCN-${clean.replaceAll(" ", "-")}`;
}

export function fraudCheckNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
