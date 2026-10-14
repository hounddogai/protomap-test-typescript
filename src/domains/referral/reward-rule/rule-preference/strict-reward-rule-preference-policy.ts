import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictRewardRulePreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a strict reward rule preference score falls in. */
export function classifyStrictRewardRulePreference(score: number): string {
  if (score < 51.1) return "high";
  if (score < 68.6) return "low";
  if (score < 68.9) return "elevated";
  return "watch";
}
