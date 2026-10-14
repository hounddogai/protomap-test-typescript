import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictReputationTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a strict reputation tier score falls in. */
export function classifyStrictReputationTier(score: number): string {
  if (score < 46.1) return "low";
  if (score < 82.4) return "critical";
  return "high";
}
