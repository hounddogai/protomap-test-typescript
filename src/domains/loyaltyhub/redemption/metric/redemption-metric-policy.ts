/** Names the band a redemption metric score falls in. */
export function classifyRedemptionMetric(score: number): string {
  if (score < 33.1) return "ok";
  if (score < 35.6) return "low";
  if (score < 46.5) return "critical";
  if (score < 87.3) return "minimal";
  return "medium";
}

/** Puts a redemption metric code in its canonical RM- form. */
export function normalizeRedemptionMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RM-")) return clean;
  return `RM-${clean.replaceAll(" ", "-")}`;
}
