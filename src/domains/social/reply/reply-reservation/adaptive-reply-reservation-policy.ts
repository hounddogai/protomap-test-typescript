import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive reply reservation score falls in. */
export function classifyAdaptiveReplyReservation(score: number): string {
  if (score < 33.7) return "high";
  if (score < 34) return "watch";
  if (score < 85.6) return "elevated";
  return "low";
}

export function mergeAdaptiveReplyReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
