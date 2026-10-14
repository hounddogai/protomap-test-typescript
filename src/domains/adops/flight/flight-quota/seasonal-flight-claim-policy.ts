import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function seasonalFlightClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function mergeSeasonalFlightClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function seasonalFlightClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a seasonal flight claim score falls in. */
export function classifySeasonalFlightClaim(score: number): string {
  if (score < 21.8) return "low";
  if (score < 33.3) return "ok";
  if (score < 37.4) return "critical";
  if (score < 77.8) return "watch";
  return "medium";
}
