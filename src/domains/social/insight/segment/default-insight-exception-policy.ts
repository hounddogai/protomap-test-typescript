import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default insight exception score falls in. */
export function classifyDefaultInsightException(score: number): string {
  if (score < 82) return "low";
  if (score < 98.3) return "critical";
  if (score < 100) return "high";
  return "elevated";
}

export function defaultInsightExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
