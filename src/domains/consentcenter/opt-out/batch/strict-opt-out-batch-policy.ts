export function strictOptOutBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Puts a strict opt out batch code in its canonical SOOB- form. */
export function normalizeStrictOptOutBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SOOB-")) return clean;
  return `SOOB-${clean.replaceAll(" ", "-")}`;
}
