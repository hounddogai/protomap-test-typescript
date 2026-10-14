import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCreditRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a credit rollup score falls in. */
export function classifyCreditRollup(score: number): string {
  if (score < 12.5) return "medium";
  if (score < 21.1) return "elevated";
  return "low";
}
