import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a pending funnel profile score falls in. */
export function classifyPendingFunnelProfile(score: number): string {
  if (score < 21.2) return "high";
  if (score < 35.2) return "ok";
  if (score < 94.6) return "watch";
  return "low";
}

export function mergePendingFunnelProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
