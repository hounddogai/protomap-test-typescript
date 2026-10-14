import * as numbers from "../../../../kit/numbers.js";

export function proofMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a proof mapping score falls in. */
export function classifyProofMapping(score: number): string {
  if (score < 15.1) return "watch";
  if (score < 25.9) return "critical";
  if (score < 47.2) return "ok";
  if (score < 98.9) return "low";
  return "minimal";
}
