import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function pathAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergePathAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 12485.0, in order. */
export function pathAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12485) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a path allocation score falls in. */
export function classifyPathAllocation(score: number): string {
  if (score < 55.6) return "watch";
  if (score < 71) return "minimal";
  if (score < 91.7) return "ok";
  return "critical";
}
