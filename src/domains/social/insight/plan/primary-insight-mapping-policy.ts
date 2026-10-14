/** Puts a primary insight mapping code in its canonical PIM- form. */
export function normalizePrimaryInsightMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PIM-")) return clean;
  return `PIM-${clean.replaceAll(" ", "-")}`;
}

export function primaryInsightMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
