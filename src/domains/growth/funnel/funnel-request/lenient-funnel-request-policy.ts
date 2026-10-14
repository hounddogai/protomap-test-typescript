import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient funnel request score falls in. */
export function classifyLenientFunnelRequest(score: number): string {
  if (score < 15.6) return "low";
  if (score < 66.1) return "medium";
  return "watch";
}

export function lenientFunnelRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
