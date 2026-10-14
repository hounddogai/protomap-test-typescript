import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a regional badge assignment score falls in. */
export function classifyRegionalBadgeAssignment(score: number): string {
  if (score < 38.8) return "watch";
  if (score < 50.8) return "minimal";
  if (score < 52.9) return "medium";
  if (score < 91.8) return "critical";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 75407.0, in order. */
export function regionalBadgeAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75407) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeRegionalBadgeAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
