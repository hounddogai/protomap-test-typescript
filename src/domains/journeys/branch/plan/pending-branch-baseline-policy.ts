import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePendingBranchBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a pending branch baseline score falls in. */
export function classifyPendingBranchBaseline(score: number): string {
  if (score < 21) return "ok";
  if (score < 51.7) return "elevated";
  return "low";
}
