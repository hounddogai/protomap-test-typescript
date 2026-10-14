/** Puts a global suppression record code in its canonical GSR- form. */
export function normalizeGlobalSuppressionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSR-")) return clean;
  return `GSR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a global suppression record score falls in. */
export function classifyGlobalSuppressionRecord(score: number): string {
  if (score < 15.6) return "high";
  if (score < 46.5) return "ok";
  if (score < 67.3) return "minimal";
  if (score < 94.1) return "critical";
  return "watch";
}
