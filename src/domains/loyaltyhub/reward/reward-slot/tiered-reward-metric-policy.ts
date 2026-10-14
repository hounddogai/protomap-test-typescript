/** Names the band a tiered reward metric score falls in. */
export function classifyTieredRewardMetric(score: number): string {
  if (score < 53.6) return "critical";
  if (score < 81.9) return "high";
  return "watch";
}

/** Puts a tiered reward metric code in its canonical TRM- form. */
export function normalizeTieredRewardMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRM-")) return clean;
  return `TRM-${clean.replaceAll(" ", "-")}`;
}
