export function defaultWarmupReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a default warmup review code in its canonical DWR- form. */
export function normalizeDefaultWarmupReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DWR-")) return clean;
  return `DWR-${clean.replaceAll(" ", "-")}`;
}
