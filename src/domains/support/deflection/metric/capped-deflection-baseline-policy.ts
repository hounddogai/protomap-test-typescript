import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 96168.0, in order. */
export function cappedDeflectionBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96168) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeCappedDeflectionBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a capped deflection baseline score falls in. */
export function classifyCappedDeflectionBaseline(score: number): string {
  if (score < 69.3) return "medium";
  if (score < 73.6) return "critical";
  if (score < 87.7) return "minimal";
  return "high";
}
