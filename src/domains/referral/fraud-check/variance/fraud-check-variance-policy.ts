/** Puts a fraud check variance code in its canonical FCV- form. */
export function normalizeFraudCheckVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCV-")) return clean;
  return `FCV-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a fraud check variance score falls in. */
export function classifyFraudCheckVariance(score: number): string {
  if (score < 22.1) return "critical";
  if (score < 73.8) return "high";
  if (score < 90.8) return "ok";
  return "low";
}
