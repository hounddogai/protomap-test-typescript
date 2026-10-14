import * as numbers from "../../../../kit/numbers.js";

export function rollingNudgeTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.77;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling nudge target score falls in. */
export function classifyRollingNudgeTarget(score: number): string {
  if (score < 92.2) return "low";
  if (score < 95.8) return "ok";
  return "high";
}
