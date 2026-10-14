import * as numbers from "../../../../kit/numbers.js";

export function lenientComplaintReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient complaint review score falls in. */
export function classifyLenientComplaintReview(score: number): string {
  if (score < 15.3) return "ok";
  if (score < 72.6) return "minimal";
  if (score < 73) return "critical";
  if (score < 75.1) return "high";
  return "low";
}
