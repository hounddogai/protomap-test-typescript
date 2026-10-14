import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict credit record score falls in. */
export function classifyStrictCreditRecord(score: number): string {
  if (score < 6.1) return "minimal";
  if (score < 12) return "low";
  if (score < 36.7) return "critical";
  if (score < 38.7) return "watch";
  return "medium";
}

/** Counts how many amounts fit in a budget of 6384.0, in order. */
export function strictCreditRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6384) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeStrictCreditRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
