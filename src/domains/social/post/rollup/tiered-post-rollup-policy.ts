import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a tiered post rollup score falls in. */
export function classifyTieredPostRollup(score: number): string {
  if (score < 53.5) return "medium";
  if (score < 58.1) return "minimal";
  if (score < 67.5) return "low";
  if (score < 96.1) return "ok";
  return "critical";
}

export function mergeTieredPostRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
