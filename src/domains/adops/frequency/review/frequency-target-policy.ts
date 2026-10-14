import * as numbers from "../../../../kit/numbers.js";

export function frequencyTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a frequency target score falls in. */
export function classifyFrequencyTarget(score: number): string {
  if (score < 5.8) return "critical";
  if (score < 24.7) return "medium";
  if (score < 68.1) return "high";
  return "ok";
}
