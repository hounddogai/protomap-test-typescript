import * as numbers from "../../../../kit/numbers.js";

export function primaryTicketViewReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function primaryTicketViewReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a primary ticket view review score falls in. */
export function classifyPrimaryTicketViewReview(score: number): string {
  if (score < 52.7) return "critical";
  if (score < 57.3) return "watch";
  if (score < 69.3) return "minimal";
  return "high";
}
