/** Puts a adaptive placement manifest code in its canonical APM- form. */
export function normalizeAdaptivePlacementManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APM-")) return clean;
  return `APM-${clean.replaceAll(" ", "-")}`;
}

export function adaptivePlacementManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
