import * as numbers from "../../../../kit/numbers.js";

export function preferenceExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a preference exception score falls in. */
export function classifyPreferenceException(score: number): string {
  if (score < 44.9) return "low";
  if (score < 61.2) return "watch";
  if (score < 99.5) return "ok";
  return "minimal";
}
