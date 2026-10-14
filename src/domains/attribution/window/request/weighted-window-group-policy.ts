import * as numbers from "../../../../kit/numbers.js";

/** Names the band a weighted window group score falls in. */
export function classifyWeightedWindowGroup(score: number): string {
  if (score < 63.3) return "elevated";
  if (score < 89.8) return "low";
  return "high";
}

export function weightedWindowGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.71;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
