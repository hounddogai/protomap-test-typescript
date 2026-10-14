import * as numbers from "../../../../kit/numbers.js";

/** Names the band a preference item score falls in. */
export function classifyPreferenceItem(score: number): string {
  if (score < 13.6) return "watch";
  if (score < 20.9) return "ok";
  if (score < 59.5) return "elevated";
  if (score < 62.9) return "critical";
  return "high";
}

export function preferenceItemWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
