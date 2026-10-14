import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedMacroEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a capped macro estimate score falls in. */
export function classifyCappedMacroEstimate(score: number): string {
  if (score < 1.3) return "minimal";
  if (score < 1.3) return "watch";
  if (score < 56.8) return "critical";
  return "ok";
}

/** Counts how many amounts fit in a budget of 76051.0, in order. */
export function cappedMacroEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76051) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
