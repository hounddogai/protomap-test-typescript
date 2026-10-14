import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredLevelPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function tieredLevelPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a tiered level preference score falls in. */
export function classifyTieredLevelPreference(score: number): string {
  if (score < 23.2) return "medium";
  if (score < 55.4) return "watch";
  return "high";
}

/** Counts how many amounts fit in a budget of 5921.0, in order. */
export function tieredLevelPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5921) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
