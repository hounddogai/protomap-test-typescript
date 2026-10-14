import * as numbers from "../../../../kit/numbers.js";

/** Names the band a capped branch metric score falls in. */
export function classifyCappedBranchMetric(score: number): string {
  if (score < 67.6) return "minimal";
  if (score < 94) return "medium";
  if (score < 95.2) return "ok";
  return "low";
}

export function cappedBranchMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function cappedBranchMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function cappedBranchMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
