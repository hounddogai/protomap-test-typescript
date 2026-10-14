import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergePacingBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function pacingBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 51640.0, in order. */
export function pacingBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51640) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
