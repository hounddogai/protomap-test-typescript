import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeInsightDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a insight draft score falls in. */
export function classifyInsightDraft(score: number): string {
  if (score < 3.1) return "elevated";
  if (score < 17.1) return "high";
  if (score < 56.3) return "minimal";
  if (score < 97.9) return "critical";
  return "watch";
}
