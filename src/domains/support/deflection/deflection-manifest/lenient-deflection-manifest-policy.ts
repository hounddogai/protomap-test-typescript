export function lenientDeflectionManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a lenient deflection manifest code in its canonical LDM- form. */
export function normalizeLenientDeflectionManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LDM-")) return clean;
  return `LDM-${clean.replaceAll(" ", "-")}`;
}
