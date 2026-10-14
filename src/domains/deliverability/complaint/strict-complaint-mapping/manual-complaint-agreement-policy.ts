import * as numbers from "../../../../kit/numbers.js";

/** Names the band a manual complaint agreement score falls in. */
export function classifyManualComplaintAgreement(score: number): string {
  if (score < 11.2) return "critical";
  if (score < 44) return "minimal";
  if (score < 66.5) return "low";
  if (score < 90.3) return "high";
  return "ok";
}

export function manualComplaintAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
