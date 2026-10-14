import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 18109.0, in order. */
export function cappedTicketViewCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18109) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeCappedTicketViewCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
