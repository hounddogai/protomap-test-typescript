import * as numbers from "../../../../kit/numbers.js";

export function nudgeRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.66;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a nudge request score falls in. */
export function classifyNudgeRequest(score: number): string {
  if (score < 34.9) return "low";
  if (score < 59.7) return "minimal";
  return "ok";
}
