import * as numbers from "../../../../kit/numbers.js";

/** Names the band a tiered bounce override score falls in. */
export function classifyTieredBounceOverride(score: number): string {
  if (score < 44.6) return "ok";
  if (score < 52.3) return "watch";
  if (score < 79.5) return "critical";
  return "low";
}

export function tieredBounceOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
