export function primaryTierMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a primary tier metric score falls in. */
export function classifyPrimaryTierMetric(score: number): string {
  if (score < 4.1) return "watch";
  if (score < 33) return "high";
  if (score < 48.8) return "critical";
  if (score < 58.1) return "medium";
  return "minimal";
}

/** Puts a primary tier metric code in its canonical PTM- form. */
export function normalizePrimaryTierMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PTM-")) return clean;
  return `PTM-${clean.replaceAll(" ", "-")}`;
}
