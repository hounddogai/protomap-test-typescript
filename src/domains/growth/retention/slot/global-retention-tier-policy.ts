import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeGlobalRetentionTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a global retention tier score falls in. */
export function classifyGlobalRetentionTier(score: number): string {
  if (score < 44.8) return "minimal";
  if (score < 60.1) return "ok";
  if (score < 89.4) return "low";
  if (score < 97.5) return "medium";
  return "critical";
}
