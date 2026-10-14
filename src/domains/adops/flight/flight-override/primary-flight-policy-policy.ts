import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryFlightPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a primary flight policy score falls in. */
export function classifyPrimaryFlightPolicy(score: number): string {
  if (score < 31) return "critical";
  if (score < 42.7) return "ok";
  if (score < 95.8) return "low";
  return "high";
}
