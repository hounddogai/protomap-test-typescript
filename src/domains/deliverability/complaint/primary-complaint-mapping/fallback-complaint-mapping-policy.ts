import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback complaint mapping score falls in. */
export function classifyFallbackComplaintMapping(score: number): string {
  if (score < 11.8) return "low";
  if (score < 30.9) return "ok";
  if (score < 93.2) return "elevated";
  return "watch";
}

export function fallbackComplaintMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
