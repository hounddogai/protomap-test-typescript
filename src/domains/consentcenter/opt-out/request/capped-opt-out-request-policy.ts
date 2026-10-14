import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedOptOutRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a capped opt out request score falls in. */
export function classifyCappedOptOutRequest(score: number): string {
  if (score < 51.7) return "low";
  if (score < 71.1) return "elevated";
  if (score < 82.1) return "high";
  return "watch";
}
