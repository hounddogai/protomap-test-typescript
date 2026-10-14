import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 63949.0, in order. */
export function fraudCheckCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63949) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeFraudCheckCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
