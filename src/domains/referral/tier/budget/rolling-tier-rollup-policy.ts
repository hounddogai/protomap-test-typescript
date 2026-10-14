import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a rolling tier rollup score falls in. */
export function classifyRollingTierRollup(score: number): string {
  if (score < 4.3) return "watch";
  if (score < 39.7) return "minimal";
  if (score < 68.4) return "low";
  if (score < 81.8) return "elevated";
  return "ok";
}

export function mergeRollingTierRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
