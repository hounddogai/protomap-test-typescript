import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function retentionMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a retention milestone score falls in. */
export function classifyRetentionMilestone(score: number): string {
  if (score < 20.6) return "low";
  if (score < 64.2) return "medium";
  if (score < 97.1) return "high";
  return "watch";
}

export function mergeRetentionMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function retentionMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
