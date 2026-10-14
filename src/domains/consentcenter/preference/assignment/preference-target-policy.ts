import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a preference target score falls in. */
export function classifyPreferenceTarget(score: number): string {
  if (score < 53.6) return "minimal";
  if (score < 61.2) return "high";
  return "ok";
}

export function mergePreferenceTargetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function preferenceTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function preferenceTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
