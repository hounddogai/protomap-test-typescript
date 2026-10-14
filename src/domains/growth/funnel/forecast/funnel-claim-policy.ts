import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeFunnelClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 3873.0, in order. */
export function funnelClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3873) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
