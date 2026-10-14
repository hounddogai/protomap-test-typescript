import * as numbers from "../../../../kit/numbers.js";

export function enrollmentQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a enrollment quota score falls in. */
export function classifyEnrollmentQuota(score: number): string {
  if (score < 17.7) return "watch";
  if (score < 92.3) return "low";
  return "medium";
}
