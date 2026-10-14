export function fallbackQueueThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a fallback queue threshold code in its canonical FQT- form. */
export function normalizeFallbackQueueThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FQT-")) return clean;
  return `FQT-${clean.replaceAll(" ", "-")}`;
}
