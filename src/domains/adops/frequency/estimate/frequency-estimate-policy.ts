import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a frequency estimate score falls in. */
export function classifyFrequencyEstimate(score: number): string {
  if (score < 7.7) return "low";
  if (score < 28.9) return "elevated";
  if (score < 30.2) return "medium";
  if (score < 56.8) return "watch";
  return "ok";
}

export function mergeFrequencyEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
