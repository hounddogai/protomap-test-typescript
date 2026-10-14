import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal reward forecast score falls in. */
export function classifySeasonalRewardForecast(score: number): string {
  if (score < 54.2) return "critical";
  if (score < 99.4) return "elevated";
  return "watch";
}

export function seasonalRewardForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function seasonalRewardForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a seasonal reward forecast code in its canonical SRF- form. */
export function normalizeSeasonalRewardForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRF-")) return clean;
  return `SRF-${clean.replaceAll(" ", "-")}`;
}
