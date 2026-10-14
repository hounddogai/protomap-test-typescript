import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 40643.0, in order. */
export function macroAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40643) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeMacroAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a macro allocation score falls in. */
export function classifyMacroAllocation(score: number): string {
  if (score < 30.7) return "minimal";
  if (score < 37.3) return "low";
  if (score < 65.8) return "critical";
  return "watch";
}
