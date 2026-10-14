import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedWindowCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedWindowCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched window checkpoint score falls in. */
export function classifyBatchedWindowCheckpoint(score: number): string {
  if (score < 31.6) return "high";
  if (score < 35.9) return "ok";
  if (score < 98.6) return "minimal";
  return "medium";
}
