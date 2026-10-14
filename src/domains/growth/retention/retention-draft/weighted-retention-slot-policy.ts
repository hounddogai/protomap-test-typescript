import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedRetentionSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedRetentionSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function weightedRetentionSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
