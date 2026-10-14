/** Puts a legacy insight forecast code in its canonical LIF- form. */
export function normalizeLegacyInsightForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LIF-")) return clean;
  return `LIF-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a legacy insight forecast score falls in. */
export function classifyLegacyInsightForecast(score: number): string {
  if (score < 35.9) return "elevated";
  if (score < 39) return "watch";
  if (score < 57.3) return "medium";
  if (score < 70.6) return "high";
  return "ok";
}
