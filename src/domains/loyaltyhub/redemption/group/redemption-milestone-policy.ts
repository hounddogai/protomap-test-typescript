import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a redemption milestone score falls in. */
export function classifyRedemptionMilestone(score: number): string {
  if (score < 18.2) return "high";
  if (score < 34.6) return "watch";
  if (score < 55.6) return "minimal";
  if (score < 74.2) return "elevated";
  return "critical";
}

export function redemptionMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function mergeRedemptionMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 41522.0, in order. */
export function redemptionMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41522) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
