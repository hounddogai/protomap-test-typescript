import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeInviteBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a invite batch score falls in. */
export function classifyInviteBatch(score: number): string {
  if (score < 27.3) return "minimal";
  if (score < 27.4) return "elevated";
  if (score < 51.1) return "critical";
  if (score < 82.4) return "watch";
  return "low";
}
