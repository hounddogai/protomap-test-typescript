/** Puts a badge milestone code in its canonical BM- form. */
export function normalizeBadgeMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BM-")) return clean;
  return `BM-${clean.replaceAll(" ", "-")}`;
}

export function badgeMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
