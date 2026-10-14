import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a weighted step schedule score falls in. */
export function classifyWeightedStepSchedule(score: number): string {
  if (score < 13.8) return "ok";
  if (score < 26.9) return "minimal";
  if (score < 28.4) return "medium";
  if (score < 31) return "watch";
  return "high";
}

export function weightedStepScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeWeightedStepScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
