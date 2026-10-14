import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a seasonal reputation variance score falls in. */
export function classifySeasonalReputationVariance(score: number): string {
  if (score < 9.1) return "critical";
  if (score < 86.8) return "elevated";
  return "low";
}

export function mergeSeasonalReputationVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 66538.0, in order. */
export function seasonalReputationVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66538) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
