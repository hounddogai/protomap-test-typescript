import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a streak bundle score falls in. */
export function classifyStreakBundle(score: number): string {
  if (score < 34.1) return "medium";
  if (score < 48.2) return "watch";
  if (score < 64.4) return "elevated";
  return "high";
}

export function mergeStreakBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
