import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a pending touchpoint estimate score falls in. */
export function classifyPendingTouchpointEstimate(score: number): string {
  if (score < 4) return "elevated";
  if (score < 9.3) return "watch";
  return "critical";
}

export function mergePendingTouchpointEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
