/** Puts a tiered queue mapping code in its canonical TQM- form. */
export function normalizeTieredQueueMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TQM-")) return clean;
  return `TQM-${clean.replaceAll(" ", "-")}`;
}

export function tieredQueueMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
