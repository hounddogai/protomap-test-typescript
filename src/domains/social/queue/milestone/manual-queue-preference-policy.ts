import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a manual queue preference score falls in. */
export function classifyManualQueuePreference(score: number): string {
  if (score < 34) return "low";
  if (score < 46.3) return "medium";
  if (score < 71.9) return "elevated";
  if (score < 85.8) return "ok";
  return "minimal";
}

export function manualQueuePreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function mergeManualQueuePreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
