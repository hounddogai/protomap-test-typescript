import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeEnrollmentEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a enrollment entry score falls in. */
export function classifyEnrollmentEntry(score: number): string {
  if (score < 16) return "critical";
  if (score < 42.1) return "medium";
  if (score < 64.9) return "elevated";
  if (score < 67) return "ok";
  return "low";
}

export function enrollmentEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
