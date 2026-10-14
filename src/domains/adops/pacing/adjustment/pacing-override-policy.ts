import * as numbers from "../../../../kit/numbers.js";

export function pacingOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a pacing override score falls in. */
export function classifyPacingOverride(score: number): string {
  if (score < 9.6) return "medium";
  if (score < 65.3) return "watch";
  return "critical";
}
