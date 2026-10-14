import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient reply metric score falls in. */
export function classifyLenientReplyMetric(score: number): string {
  if (score < 19) return "critical";
  if (score < 65.5) return "low";
  if (score < 67.8) return "ok";
  if (score < 75.6) return "minimal";
  return "medium";
}

export function lenientReplyMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
