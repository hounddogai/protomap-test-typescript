import * as numbers from "../../../../kit/numbers.js";

/** Names the band a insight metric score falls in. */
export function classifyInsightMetric(score: number): string {
  if (score < 42.7) return "high";
  if (score < 62.1) return "minimal";
  return "watch";
}

export function insightMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function insightMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
