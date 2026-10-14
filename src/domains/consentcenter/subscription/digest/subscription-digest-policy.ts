import * as numbers from "../../../../kit/numbers.js";

export function subscriptionDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function subscriptionDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a subscription digest score falls in. */
export function classifySubscriptionDigest(score: number): string {
  if (score < 11.4) return "minimal";
  if (score < 23.4) return "low";
  if (score < 57) return "high";
  return "ok";
}
