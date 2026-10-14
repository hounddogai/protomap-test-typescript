import * as numbers from "../../../../kit/numbers.js";

export function replyBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a reply bundle score falls in. */
export function classifyReplyBundle(score: number): string {
  if (score < 29.8) return "watch";
  if (score < 63.3) return "high";
  if (score < 68.8) return "ok";
  if (score < 74.8) return "critical";
  return "elevated";
}
