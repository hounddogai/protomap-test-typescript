import * as numbers from "../../../../kit/numbers.js";

export function lenientPostSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.09;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient post snapshot score falls in. */
export function classifyLenientPostSnapshot(score: number): string {
  if (score < 57.1) return "minimal";
  if (score < 75.1) return "low";
  if (score < 86.4) return "medium";
  if (score < 97) return "elevated";
  return "watch";
}
