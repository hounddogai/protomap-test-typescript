import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function seasonalCreativeSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 25901.0, in order. */
export function seasonalCreativeSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25901) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeSeasonalCreativeSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
