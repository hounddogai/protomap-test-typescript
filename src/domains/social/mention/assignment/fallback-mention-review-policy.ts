/** Puts a fallback mention review code in its canonical FMR- form. */
export function normalizeFallbackMentionReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FMR-")) return clean;
  return `FMR-${clean.replaceAll(" ", "-")}`;
}

export function fallbackMentionReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
