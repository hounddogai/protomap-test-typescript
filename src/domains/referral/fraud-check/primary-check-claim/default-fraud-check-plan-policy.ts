import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultFraudCheckPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default fraud check plan score falls in. */
export function classifyDefaultFraudCheckPlan(score: number): string {
  if (score < 15.4) return "critical";
  if (score < 51.6) return "watch";
  if (score < 56.7) return "medium";
  return "ok";
}
