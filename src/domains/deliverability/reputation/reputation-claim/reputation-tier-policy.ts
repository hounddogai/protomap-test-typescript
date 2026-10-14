import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a reputation tier score falls in. */
export function classifyReputationTier(score: number): string {
  if (score < 34.4) return "minimal";
  if (score < 62.3) return "elevated";
  if (score < 87) return "ok";
  if (score < 97.2) return "critical";
  return "medium";
}

export function mergeReputationTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
