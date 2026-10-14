import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedEnrollmentMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function weightedEnrollmentMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function weightedEnrollmentMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a weighted enrollment milestone score falls in. */
export function classifyWeightedEnrollmentMilestone(score: number): string {
  if (score < 67.2) return "medium";
  if (score < 94) return "ok";
  return "minimal";
}
