import * as numbers from "../../../../kit/numbers.js";

/** Names the band a flight request score falls in. */
export function classifyFlightRequest(score: number): string {
  if (score < 14.6) return "high";
  if (score < 33.5) return "elevated";
  if (score < 51) return "watch";
  if (score < 90.3) return "critical";
  return "minimal";
}

export function flightRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
