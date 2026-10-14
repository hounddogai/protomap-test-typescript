import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeEnrollmentAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 45537.0, in order. */
export function enrollmentAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45537) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
