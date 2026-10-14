import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global enrollment slot score falls in. */
export function classifyGlobalEnrollmentSlot(score: number): string {
  if (score < 9.2) return "critical";
  if (score < 94.7) return "medium";
  return "minimal";
}

export function mergeGlobalEnrollmentSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
