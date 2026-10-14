import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a suppression cycle score falls in. */
export function classifySuppressionCycle(score: number): string {
  if (score < 2.9) return "elevated";
  if (score < 98.9) return "medium";
  return "ok";
}

/** Counts how many amounts fit in a budget of 52770.0, in order. */
export function suppressionCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52770) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function suppressionCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeSuppressionCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
