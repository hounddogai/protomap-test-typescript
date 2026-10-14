import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeManualRetentionScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function manualRetentionScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function manualRetentionScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a manual retention score score falls in. */
export function classifyManualRetentionScore(score: number): string {
  if (score < 66.7) return "medium";
  if (score < 93.1) return "ok";
  return "high";
}
