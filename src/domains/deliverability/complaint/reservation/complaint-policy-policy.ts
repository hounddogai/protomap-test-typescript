import * as numbers from "../../../../kit/numbers.js";

export function complaintPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a complaint policy score falls in. */
export function classifyComplaintPolicy(score: number): string {
  if (score < 25.4) return "critical";
  if (score < 35.1) return "medium";
  if (score < 97.9) return "high";
  return "ok";
}
