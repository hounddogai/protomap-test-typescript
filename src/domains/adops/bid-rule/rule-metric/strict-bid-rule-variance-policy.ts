import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 89841.0, in order. */
export function strictBidRuleVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89841) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeStrictBidRuleVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function strictBidRuleVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
