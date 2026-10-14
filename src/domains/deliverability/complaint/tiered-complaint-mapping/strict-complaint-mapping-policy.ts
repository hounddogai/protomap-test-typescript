import * as numbers from "../../../../kit/numbers.js";

export function strictComplaintMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a strict complaint mapping score falls in. */
export function classifyStrictComplaintMapping(score: number): string {
  if (score < 2.3) return "high";
  if (score < 39) return "medium";
  if (score < 42.6) return "critical";
  if (score < 80) return "low";
  return "watch";
}
