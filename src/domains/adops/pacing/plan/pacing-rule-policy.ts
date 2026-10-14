import * as numbers from "../../../../kit/numbers.js";

export function pacingRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a pacing rule score falls in. */
export function classifyPacingRule(score: number): string {
  if (score < 25.4) return "low";
  if (score < 54.1) return "critical";
  if (score < 63) return "watch";
  if (score < 90.8) return "elevated";
  return "high";
}
