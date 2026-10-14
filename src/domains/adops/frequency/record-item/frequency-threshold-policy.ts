import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a frequency threshold score falls in. */
export function classifyFrequencyThreshold(score: number): string {
  if (score < 87.9) return "minimal";
  if (score < 88.3) return "elevated";
  return "ok";
}

export function mergeFrequencyThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
