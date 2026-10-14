import * as numbers from "../../../../kit/numbers.js";

export function adaptiveCsatMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a adaptive csat milestone score falls in. */
export function classifyAdaptiveCsatMilestone(score: number): string {
  if (score < 20.5) return "low";
  if (score < 34.6) return "watch";
  if (score < 40.9) return "critical";
  if (score < 70.8) return "elevated";
  return "high";
}
