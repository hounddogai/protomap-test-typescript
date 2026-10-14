import * as numbers from "../../../../kit/numbers.js";

export function macroTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a macro tier score falls in. */
export function classifyMacroTier(score: number): string {
  if (score < 3.2) return "watch";
  if (score < 71) return "ok";
  if (score < 82.6) return "high";
  return "critical";
}
