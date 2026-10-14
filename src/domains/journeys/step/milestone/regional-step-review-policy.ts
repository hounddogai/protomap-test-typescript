import * as numbers from "../../../../kit/numbers.js";

export function regionalStepReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional step review score falls in. */
export function classifyRegionalStepReview(score: number): string {
  if (score < 8.4) return "watch";
  if (score < 41.4) return "ok";
  return "medium";
}
