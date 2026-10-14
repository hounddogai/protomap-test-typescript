import * as numbers from "../../../../kit/numbers.js";

export function retentionNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a retention notice score falls in. */
export function classifyRetentionNotice(score: number): string {
  if (score < 13.3) return "low";
  if (score < 35.1) return "watch";
  if (score < 39.7) return "critical";
  if (score < 47.9) return "high";
  return "ok";
}
