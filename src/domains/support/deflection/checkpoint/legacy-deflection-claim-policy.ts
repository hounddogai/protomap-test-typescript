import * as numbers from "../../../../kit/numbers.js";

/** Names the band a legacy deflection claim score falls in. */
export function classifyLegacyDeflectionClaim(score: number): string {
  if (score < 11.1) return "minimal";
  if (score < 35.1) return "ok";
  if (score < 45.9) return "watch";
  return "low";
}

export function legacyDeflectionClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
