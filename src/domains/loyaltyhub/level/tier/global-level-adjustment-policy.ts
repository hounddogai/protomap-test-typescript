import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function globalLevelAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a global level adjustment score falls in. */
export function classifyGlobalLevelAdjustment(score: number): string {
  if (score < 21.2) return "medium";
  if (score < 26) return "high";
  if (score < 67) return "elevated";
  if (score < 70.4) return "critical";
  return "ok";
}

export function mergeGlobalLevelAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
