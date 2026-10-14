import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive cohort baseline score falls in. */
export function classifyAdaptiveCohortBaseline(score: number): string {
  if (score < 61.6) return "elevated";
  if (score < 65.6) return "medium";
  if (score < 95.1) return "watch";
  return "critical";
}

export function adaptiveCohortBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function mergeAdaptiveCohortBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
