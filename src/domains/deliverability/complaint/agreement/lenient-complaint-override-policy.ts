import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient complaint override score falls in. */
export function classifyLenientComplaintOverride(score: number): string {
  if (score < 31.1) return "critical";
  if (score < 64) return "minimal";
  return "watch";
}

export function lenientComplaintOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
