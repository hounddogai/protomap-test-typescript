import * as numbers from "../../../../kit/numbers.js";

export function adaptiveDomainMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a adaptive domain metric score falls in. */
export function classifyAdaptiveDomainMetric(score: number): string {
  if (score < 44.3) return "elevated";
  if (score < 72.3) return "watch";
  return "minimal";
}
