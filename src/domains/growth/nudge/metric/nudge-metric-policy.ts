import * as numbers from "../../../../kit/numbers.js";

/** Names the band a nudge metric score falls in. */
export function classifyNudgeMetric(score: number): string {
  if (score < 35.9) return "ok";
  if (score < 82.5) return "low";
  return "critical";
}

export function nudgeMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function nudgeMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
