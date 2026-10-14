import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function nudgeGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a nudge group score falls in. */
export function classifyNudgeGroup(score: number): string {
  if (score < 15.2) return "medium";
  if (score < 16.3) return "watch";
  if (score < 36.5) return "elevated";
  if (score < 64.6) return "high";
  return "critical";
}

export function nudgeGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function mergeNudgeGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
