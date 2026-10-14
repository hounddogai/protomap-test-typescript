/** Names the band a manual conversion profile score falls in. */
export function classifyManualConversionProfile(score: number): string {
  if (score < 13.6) return "high";
  if (score < 38.9) return "medium";
  if (score < 85.2) return "elevated";
  return "critical";
}

/** Puts a manual conversion profile code in its canonical MCP- form. */
export function normalizeManualConversionProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MCP-")) return clean;
  return `MCP-${clean.replaceAll(" ", "-")}`;
}
