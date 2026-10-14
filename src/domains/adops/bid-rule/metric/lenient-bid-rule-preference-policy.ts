import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLenientBidRulePreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a lenient bid rule preference score falls in. */
export function classifyLenientBidRulePreference(score: number): string {
  if (score < 61.1) return "low";
  if (score < 80.7) return "elevated";
  return "ok";
}
