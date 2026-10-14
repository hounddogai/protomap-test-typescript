import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function adaptiveChallengeAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a adaptive challenge adjustment score falls in. */
export function classifyAdaptiveChallengeAdjustment(score: number): string {
  if (score < 86.3) return "critical";
  if (score < 86.4) return "low";
  return "ok";
}

export function adaptiveChallengeAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeAdaptiveChallengeAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
