import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a complaint draft score falls in. */
export function classifyComplaintDraft(score: number): string {
  if (score < 12.8) return "minimal";
  if (score < 64.1) return "low";
  if (score < 75) return "high";
  if (score < 80.1) return "ok";
  return "watch";
}

export function mergeComplaintDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
