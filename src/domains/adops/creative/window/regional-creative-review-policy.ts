import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a regional creative review score falls in. */
export function classifyRegionalCreativeReview(score: number): string {
  if (score < 45.6) return "watch";
  if (score < 68.5) return "minimal";
  if (score < 69.2) return "critical";
  if (score < 83.7) return "ok";
  return "low";
}

/** Counts how many amounts fit in a budget of 1087.0, in order. */
export function regionalCreativeReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1087) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeRegionalCreativeReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
