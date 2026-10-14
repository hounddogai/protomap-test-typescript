import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function cappedBidRuleReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 93218.0, in order. */
export function cappedBidRuleReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93218) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped bid rule review score falls in. */
export function classifyCappedBidRuleReview(score: number): string {
  if (score < 2.8) return "watch";
  if (score < 12.1) return "high";
  if (score < 12.3) return "medium";
  if (score < 72.3) return "minimal";
  return "low";
}

export function mergeCappedBidRuleReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
