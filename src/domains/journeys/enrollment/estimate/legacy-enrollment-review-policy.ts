import * as numbers from "../../../../kit/numbers.js";

export function legacyEnrollmentReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function legacyEnrollmentReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function legacyEnrollmentReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a legacy enrollment review score falls in. */
export function classifyLegacyEnrollmentReview(score: number): string {
  if (score < 5) return "watch";
  if (score < 5.3) return "medium";
  if (score < 5.9) return "high";
  return "low";
}
