import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 56987.0, in order. */
export function weightedReputationMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56987) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedReputationMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a weighted reputation milestone score falls in. */
export function classifyWeightedReputationMilestone(score: number): string {
  if (score < 8.4) return "watch";
  if (score < 35.7) return "elevated";
  return "high";
}

export function mergeWeightedReputationMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
