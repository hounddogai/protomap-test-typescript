import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback enrollment allocation score falls in. */
export function classifyFallbackEnrollmentAllocation(score: number): string {
  if (score < 21.2) return "elevated";
  if (score < 21.2) return "low";
  return "minimal";
}

export function fallbackEnrollmentAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
