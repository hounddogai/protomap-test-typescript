/** Puts a level mapping code in its canonical LM- form. */
export function normalizeLevelMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LM-")) return clean;
  return `LM-${clean.replaceAll(" ", "-")}`;
}

export function levelMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
