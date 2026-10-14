import * as numbers from "../../../../kit/numbers.js";

/** Names the band a badge threshold score falls in. */
export function classifyBadgeThreshold(score: number): string {
  if (score < 11.3) return "low";
  if (score < 41.4) return "ok";
  if (score < 83.4) return "critical";
  if (score < 86.2) return "watch";
  return "medium";
}

export function badgeThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function badgeThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
