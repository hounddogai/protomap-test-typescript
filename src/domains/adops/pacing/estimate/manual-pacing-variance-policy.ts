import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a manual pacing variance score falls in. */
export function classifyManualPacingVariance(score: number): string {
  if (score < 44.5) return "critical";
  if (score < 58.1) return "elevated";
  if (score < 77.8) return "medium";
  if (score < 91.1) return "watch";
  return "minimal";
}

export function mergeManualPacingVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function manualPacingVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
