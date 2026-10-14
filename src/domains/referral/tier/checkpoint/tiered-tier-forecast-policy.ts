/** Names the band a tiered tier forecast score falls in. */
export function classifyTieredTierForecast(score: number): string {
  if (score < 8.3) return "low";
  if (score < 64) return "watch";
  if (score < 95.3) return "high";
  return "critical";
}

export function tieredTierForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
