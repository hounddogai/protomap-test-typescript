export function adaptiveWarmupTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a adaptive warmup tier code in its canonical AWT- form. */
export function normalizeAdaptiveWarmupTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AWT-")) return clean;
  return `AWT-${clean.replaceAll(" ", "-")}`;
}
