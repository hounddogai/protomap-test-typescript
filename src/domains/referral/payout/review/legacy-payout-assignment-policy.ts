import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a legacy payout assignment score falls in. */
export function classifyLegacyPayoutAssignment(score: number): string {
  if (score < 20.9) return "elevated";
  if (score < 46.2) return "medium";
  if (score < 72.2) return "ok";
  if (score < 88.3) return "high";
  return "watch";
}

export function mergeLegacyPayoutAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
