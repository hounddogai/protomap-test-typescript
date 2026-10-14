import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fallback path batch score falls in. */
export function classifyFallbackPathBatch(score: number): string {
  if (score < 5.4) return "high";
  if (score < 7.3) return "minimal";
  if (score < 37.1) return "critical";
  return "low";
}

export function fallbackPathBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fallbackPathBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function mergeFallbackPathBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
