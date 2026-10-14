/** Puts a rolling domain metric code in its canonical RDM- form. */
export function normalizeRollingDomainMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RDM-")) return clean;
  return `RDM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling domain metric score falls in. */
export function classifyRollingDomainMetric(score: number): string {
  if (score < 66.9) return "low";
  if (score < 83.3) return "elevated";
  return "high";
}
