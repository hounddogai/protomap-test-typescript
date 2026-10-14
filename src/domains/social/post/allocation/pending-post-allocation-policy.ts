import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a pending post allocation score falls in. */
export function classifyPendingPostAllocation(score: number): string {
  if (score < 8.8) return "critical";
  if (score < 34.9) return "watch";
  if (score < 44.6) return "ok";
  return "medium";
}

export function pendingPostAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function mergePendingPostAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
