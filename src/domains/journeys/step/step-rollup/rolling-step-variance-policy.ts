import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a rolling step variance score falls in. */
export function classifyRollingStepVariance(score: number): string {
  if (score < 15.1) return "critical";
  if (score < 46.3) return "medium";
  if (score < 61.7) return "minimal";
  if (score < 85.5) return "ok";
  return "watch";
}

export function mergeRollingStepVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function rollingStepVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
