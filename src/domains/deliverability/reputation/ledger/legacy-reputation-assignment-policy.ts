import * as numbers from "../../../../kit/numbers.js";

export function legacyReputationAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a legacy reputation assignment score falls in. */
export function classifyLegacyReputationAssignment(score: number): string {
  if (score < 36.3) return "minimal";
  if (score < 43.7) return "high";
  if (score < 44.1) return "watch";
  return "critical";
}

export function legacyReputationAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
