/** Names the band a fallback window baseline score falls in. */
export function classifyFallbackWindowBaseline(score: number): string {
  if (score < 64) return "low";
  if (score < 86) return "ok";
  return "minimal";
}

/** Puts a fallback window baseline code in its canonical FWB- form. */
export function normalizeFallbackWindowBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FWB-")) return clean;
  return `FWB-${clean.replaceAll(" ", "-")}`;
}
