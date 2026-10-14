import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedWindowReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 30060.0, in order. */
export function weightedWindowReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30060) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
