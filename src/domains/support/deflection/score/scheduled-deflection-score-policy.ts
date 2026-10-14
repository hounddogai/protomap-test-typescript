import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeScheduledDeflectionScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 65533.0, in order. */
export function scheduledDeflectionScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65533) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledDeflectionScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
