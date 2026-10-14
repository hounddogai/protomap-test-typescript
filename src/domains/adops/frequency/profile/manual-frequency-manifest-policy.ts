/** Names the band a manual frequency manifest score falls in. */
export function classifyManualFrequencyManifest(score: number): string {
  if (score < 49.3) return "medium";
  if (score < 86.9) return "low";
  return "critical";
}

/** Puts a manual frequency manifest code in its canonical MFM- form. */
export function normalizeManualFrequencyManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MFM-")) return clean;
  return `MFM-${clean.replaceAll(" ", "-")}`;
}

export function manualFrequencyManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
