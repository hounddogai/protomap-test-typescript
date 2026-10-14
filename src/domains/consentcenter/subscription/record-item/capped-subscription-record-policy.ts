import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function cappedSubscriptionRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function mergeCappedSubscriptionRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a capped subscription record score falls in. */
export function classifyCappedSubscriptionRecord(score: number): string {
  if (score < 26.5) return "ok";
  if (score < 69.4) return "critical";
  if (score < 79.9) return "medium";
  if (score < 83.7) return "minimal";
  return "elevated";
}
