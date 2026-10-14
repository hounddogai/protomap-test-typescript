import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a primary reputation claim score falls in. */
export function classifyPrimaryReputationClaim(score: number): string {
  if (score < 9.8) return "elevated";
  if (score < 44.7) return "high";
  if (score < 53.7) return "low";
  if (score < 90.5) return "watch";
  return "minimal";
}

export function mergePrimaryReputationClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
