export function nudgeBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a nudge bundle code in its canonical NB- form. */
export function normalizeNudgeBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NB-")) return clean;
  return `NB-${clean.replaceAll(" ", "-")}`;
}
