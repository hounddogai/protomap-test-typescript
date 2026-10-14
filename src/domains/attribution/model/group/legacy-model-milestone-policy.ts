import * as numbers from "../../../../kit/numbers.js";

/** Names the band a legacy model milestone score falls in. */
export function classifyLegacyModelMilestone(score: number): string {
  if (score < 72.7) return "high";
  if (score < 76.4) return "ok";
  return "low";
}

export function legacyModelMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
