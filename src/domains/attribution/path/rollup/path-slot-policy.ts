import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a path slot score falls in. */
export function classifyPathSlot(score: number): string {
  if (score < 15.8) return "medium";
  if (score < 83.6) return "low";
  if (score < 86.8) return "critical";
  if (score < 93.9) return "elevated";
  return "ok";
}

export function mergePathSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 17347.0, in order. */
export function pathSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17347) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
