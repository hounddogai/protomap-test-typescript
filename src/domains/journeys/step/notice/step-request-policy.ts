import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeStepRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function stepRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 68899.0, in order. */
export function stepRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68899) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a step request score falls in. */
export function classifyStepRequest(score: number): string {
  if (score < 43) return "medium";
  if (score < 79.3) return "elevated";
  if (score < 80.5) return "critical";
  return "high";
}
