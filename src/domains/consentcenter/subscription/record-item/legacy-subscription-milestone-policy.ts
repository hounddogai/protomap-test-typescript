import * as numbers from "../../../../kit/numbers.js";

/** Names the band a legacy subscription milestone score falls in. */
export function classifyLegacySubscriptionMilestone(score: number): string {
  if (score < 68.8) return "ok";
  if (score < 90.1) return "high";
  if (score < 98) return "critical";
  return "watch";
}

export function legacySubscriptionMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
