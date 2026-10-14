import * as numbers from "../../../../kit/numbers.js";

export function conversionClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a conversion claim score falls in. */
export function classifyConversionClaim(score: number): string {
  if (score < 8.6) return "medium";
  if (score < 32.5) return "ok";
  if (score < 66.1) return "high";
  if (score < 79.6) return "low";
  return "elevated";
}
