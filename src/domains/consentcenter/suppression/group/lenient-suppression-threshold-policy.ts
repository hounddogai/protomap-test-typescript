import * as numbers from "../../../../kit/numbers.js";

export function lenientSuppressionThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a lenient suppression threshold score falls in. */
export function classifyLenientSuppressionThreshold(score: number): string {
  if (score < 10.1) return "low";
  if (score < 64.2) return "minimal";
  return "ok";
}
