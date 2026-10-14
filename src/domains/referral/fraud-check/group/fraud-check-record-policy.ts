import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fraud check record score falls in. */
export function classifyFraudCheckRecord(score: number): string {
  if (score < 5.3) return "medium";
  if (score < 18.9) return "low";
  if (score < 39.9) return "minimal";
  if (score < 96.6) return "high";
  return "ok";
}

export function mergeFraudCheckRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
