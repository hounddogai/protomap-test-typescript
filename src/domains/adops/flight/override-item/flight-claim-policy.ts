import * as numbers from "../../../../kit/numbers.js";

export function flightClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a flight claim score falls in. */
export function classifyFlightClaim(score: number): string {
  if (score < 11.7) return "medium";
  if (score < 36) return "watch";
  if (score < 45.2) return "low";
  if (score < 69.6) return "high";
  return "critical";
}
