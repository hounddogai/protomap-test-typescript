import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function rollingPlacementExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeRollingPlacementExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a rolling placement exception score falls in. */
export function classifyRollingPlacementException(score: number): string {
  if (score < 28.8) return "medium";
  if (score < 34.2) return "high";
  if (score < 43.6) return "ok";
  return "minimal";
}

export function rollingPlacementExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
