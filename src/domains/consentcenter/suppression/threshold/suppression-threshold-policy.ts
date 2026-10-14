import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeSuppressionThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function suppressionThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function suppressionThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.06;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
