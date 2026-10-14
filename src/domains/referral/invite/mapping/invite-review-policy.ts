import * as numbers from "../../../../kit/numbers.js";

/** Names the band a invite review score falls in. */
export function classifyInviteReview(score: number): string {
  if (score < 16) return "minimal";
  if (score < 31.9) return "watch";
  return "elevated";
}

export function inviteReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function inviteReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
