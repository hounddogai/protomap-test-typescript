import * as numbers from "../../../../kit/numbers.js";

export function waitEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a wait estimate score falls in. */
export function classifyWaitEstimate(score: number): string {
  if (score < 25.2) return "minimal";
  if (score < 28.4) return "medium";
  if (score < 44.8) return "high";
  return "critical";
}
