import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeFallbackInsightGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function fallbackInsightGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a fallback insight group score falls in. */
export function classifyFallbackInsightGroup(score: number): string {
  if (score < 33) return "minimal";
  if (score < 58) return "medium";
  if (score < 94.9) return "critical";
  return "low";
}

export function fallbackInsightGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
