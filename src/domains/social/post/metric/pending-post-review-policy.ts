import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 19225.0, in order. */
export function pendingPostReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19225) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePendingPostReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a pending post review score falls in. */
export function classifyPendingPostReview(score: number): string {
  if (score < 32.2) return "watch";
  if (score < 88.5) return "elevated";
  return "low";
}
