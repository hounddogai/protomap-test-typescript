import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a weighted double opt in digest score falls in. */
export function classifyWeightedDoubleOptInDigest(score: number): string {
  if (score < 13.1) return "ok";
  if (score < 39.3) return "minimal";
  if (score < 49.9) return "low";
  return "watch";
}

export function mergeWeightedDoubleOptInDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
