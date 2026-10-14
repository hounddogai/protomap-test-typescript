/** Puts a fallback reward review code in its canonical FRR- form. */
export function normalizeFallbackRewardReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FRR-")) return clean;
  return `FRR-${clean.replaceAll(" ", "-")}`;
}

export function fallbackRewardReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
