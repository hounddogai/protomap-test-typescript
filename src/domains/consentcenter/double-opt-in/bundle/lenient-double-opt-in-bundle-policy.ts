import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLenientDoubleOptInBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a lenient double opt in bundle score falls in. */
export function classifyLenientDoubleOptInBundle(score: number): string {
  if (score < 62.4) return "medium";
  if (score < 92.3) return "watch";
  return "low";
}
