import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyMentionRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy mention rule score falls in. */
export function classifyLegacyMentionRule(score: number): string {
  if (score < 20.8) return "elevated";
  if (score < 57.1) return "minimal";
  if (score < 81.3) return "watch";
  if (score < 86.2) return "high";
  return "ok";
}
