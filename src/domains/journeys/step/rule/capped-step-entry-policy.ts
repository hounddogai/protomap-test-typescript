import * as numbers from "../../../../kit/numbers.js";

export function cappedStepEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a capped step entry score falls in. */
export function classifyCappedStepEntry(score: number): string {
  if (score < 29.9) return "ok";
  if (score < 30.9) return "critical";
  if (score < 42.4) return "watch";
  return "medium";
}
