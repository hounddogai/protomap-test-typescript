import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a primary nudge variance score falls in. */
export function classifyPrimaryNudgeVariance(score: number): string {
  if (score < 56.2) return "high";
  if (score < 71.5) return "medium";
  return "watch";
}

export function mergePrimaryNudgeVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function primaryNudgeVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
