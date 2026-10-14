import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeManualStreakTargetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 6784.0, in order. */
export function manualStreakTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6784) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
