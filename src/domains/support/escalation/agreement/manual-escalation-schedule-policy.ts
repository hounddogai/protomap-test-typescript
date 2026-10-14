import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function manualEscalationScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 42153.0, in order. */
export function manualEscalationScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42153) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeManualEscalationScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function manualEscalationScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
