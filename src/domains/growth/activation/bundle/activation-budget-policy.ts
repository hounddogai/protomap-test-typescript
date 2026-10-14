import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeActivationBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 29828.0, in order. */
export function activationBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29828) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
