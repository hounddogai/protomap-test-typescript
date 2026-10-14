/** Puts a regional complaint mapping code in its canonical RCM- form. */
export function normalizeRegionalComplaintMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCM-")) return clean;
  return `RCM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a regional complaint mapping score falls in. */
export function classifyRegionalComplaintMapping(score: number): string {
  if (score < 24.6) return "low";
  if (score < 48.7) return "elevated";
  if (score < 77) return "medium";
  return "minimal";
}
