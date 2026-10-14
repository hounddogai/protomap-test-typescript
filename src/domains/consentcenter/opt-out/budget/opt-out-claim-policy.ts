import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeOptOutClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function optOutClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a opt out claim score falls in. */
export function classifyOptOutClaim(score: number): string {
  if (score < 53.7) return "medium";
  if (score < 81.7) return "critical";
  if (score < 84.4) return "high";
  if (score < 97.3) return "low";
  return "elevated";
}
