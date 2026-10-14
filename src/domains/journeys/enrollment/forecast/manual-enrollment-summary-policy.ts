/** Puts a manual enrollment summary code in its canonical MES- form. */
export function normalizeManualEnrollmentSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MES-")) return clean;
  return `MES-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a manual enrollment summary score falls in. */
export function classifyManualEnrollmentSummary(score: number): string {
  if (score < 19.5) return "watch";
  if (score < 52.8) return "medium";
  if (score < 96) return "low";
  return "minimal";
}
