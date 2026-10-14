import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingStepForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 79247.0, in order. */
export function rollingStepForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79247) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
