import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedWaitSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a weighted wait slot score falls in. */
export function classifyWeightedWaitSlot(score: number): string {
  if (score < 9.1) return "watch";
  if (score < 60.5) return "critical";
  if (score < 67.8) return "low";
  if (score < 97) return "medium";
  return "high";
}

/** Counts how many amounts fit in a budget of 20680.0, in order. */
export function weightedWaitSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20680) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
