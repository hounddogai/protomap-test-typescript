import * as numbers from "../../../../kit/numbers.js";

export function lenientRetentionForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a lenient retention forecast score falls in. */
export function classifyLenientRetentionForecast(score: number): string {
  if (score < 27.5) return "minimal";
  if (score < 31.8) return "critical";
  if (score < 73.7) return "watch";
  if (score < 88.9) return "elevated";
  return "high";
}
