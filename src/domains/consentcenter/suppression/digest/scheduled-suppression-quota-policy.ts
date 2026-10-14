import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeScheduledSuppressionQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 74577.0, in order. */
export function scheduledSuppressionQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74577) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
