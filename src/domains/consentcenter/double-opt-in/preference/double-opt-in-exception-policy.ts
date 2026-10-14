import * as numbers from "../../../../kit/numbers.js";

export function doubleOptInExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a double opt in exception score falls in. */
export function classifyDoubleOptInException(score: number): string {
  if (score < 10.5) return "watch";
  if (score < 10.8) return "low";
  return "critical";
}
