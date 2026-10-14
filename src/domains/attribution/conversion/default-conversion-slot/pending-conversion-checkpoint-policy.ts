import * as numbers from "../../../../kit/numbers.js";

export function pendingConversionCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a pending conversion checkpoint score falls in. */
export function classifyPendingConversionCheckpoint(score: number): string {
  if (score < 10.6) return "medium";
  if (score < 11.4) return "high";
  if (score < 39.4) return "low";
  if (score < 56.4) return "minimal";
  return "critical";
}
