import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function lenientSubscriptionMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeLenientSubscriptionMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a lenient subscription milestone score falls in. */
export function classifyLenientSubscriptionMilestone(score: number): string {
  if (score < 29.9) return "critical";
  if (score < 61.2) return "minimal";
  if (score < 75.4) return "watch";
  return "low";
}

export function lenientSubscriptionMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
