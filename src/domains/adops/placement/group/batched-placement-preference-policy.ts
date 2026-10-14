import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a batched placement preference score falls in. */
export function classifyBatchedPlacementPreference(score: number): string {
  if (score < 13.8) return "watch";
  if (score < 84.5) return "ok";
  return "critical";
}

export function mergeBatchedPlacementPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 97420.0, in order. */
export function batchedPlacementPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97420) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedPlacementPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
