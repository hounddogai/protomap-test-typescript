import * as numbers from "../../../../kit/numbers.js";

export function rollingNudgePreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling nudge preference score falls in. */
export function classifyRollingNudgePreference(score: number): string {
  if (score < 2.3) return "high";
  if (score < 27.6) return "watch";
  if (score < 67.2) return "low";
  return "critical";
}
