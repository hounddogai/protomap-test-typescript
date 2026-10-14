import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 82409.0, in order. */
export function pathScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82409) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePathScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function pathScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a path schedule score falls in. */
export function classifyPathSchedule(score: number): string {
  if (score < 8.7) return "minimal";
  if (score < 87.9) return "medium";
  if (score < 94.8) return "critical";
  if (score < 99.6) return "watch";
  return "elevated";
}
