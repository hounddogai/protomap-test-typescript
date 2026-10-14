import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped flight score score falls in. */
export function classifyCappedFlightScore(score: number): string {
  if (score < 25.7) return "watch";
  if (score < 37.4) return "minimal";
  if (score < 51) return "ok";
  if (score < 85) return "medium";
  return "low";
}

export function mergeCappedFlightScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function cappedFlightScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function cappedFlightScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
