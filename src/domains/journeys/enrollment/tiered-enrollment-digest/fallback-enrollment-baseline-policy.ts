import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fallback enrollment baseline score falls in. */
export function classifyFallbackEnrollmentBaseline(score: number): string {
  if (score < 28.5) return "ok";
  if (score < 51.9) return "elevated";
  if (score < 89.4) return "minimal";
  return "critical";
}

export function fallbackEnrollmentBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function mergeFallbackEnrollmentBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
