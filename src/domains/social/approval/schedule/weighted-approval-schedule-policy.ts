import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a weighted approval schedule score falls in. */
export function classifyWeightedApprovalSchedule(score: number): string {
  if (score < 13.9) return "ok";
  if (score < 38.3) return "critical";
  return "low";
}

export function mergeWeightedApprovalScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
