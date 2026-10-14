export function seasonalBidRuleQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a seasonal bid rule quota code in its canonical SBRQ- form. */
export function normalizeSeasonalBidRuleQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBRQ-")) return clean;
  return `SBRQ-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal bid rule quota score falls in. */
export function classifySeasonalBidRuleQuota(score: number): string {
  if (score < 63.7) return "high";
  if (score < 71.4) return "minimal";
  return "critical";
}
