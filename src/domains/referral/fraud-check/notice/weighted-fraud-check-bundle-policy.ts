import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a weighted fraud check bundle score falls in. */
export function classifyWeightedFraudCheckBundle(score: number): string {
  if (score < 7.5) return "critical";
  if (score < 50.7) return "minimal";
  return "elevated";
}

export function mergeWeightedFraudCheckBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
