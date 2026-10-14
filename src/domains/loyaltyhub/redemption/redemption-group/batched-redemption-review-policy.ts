import * as numbers from "../../../../kit/numbers.js";

export function batchedRedemptionReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a batched redemption review score falls in. */
export function classifyBatchedRedemptionReview(score: number): string {
  if (score < 27.9) return "ok";
  if (score < 38.6) return "watch";
  if (score < 74.9) return "low";
  return "high";
}
