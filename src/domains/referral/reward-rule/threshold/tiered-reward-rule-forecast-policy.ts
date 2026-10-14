import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 27909.0, in order. */
export function tieredRewardRuleForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 27909) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredRewardRuleForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeTieredRewardRuleForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
