import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a batched path profile score falls in. */
export function classifyBatchedPathProfile(score: number): string {
  if (score < 8.2) return "medium";
  if (score < 9.9) return "critical";
  if (score < 69.4) return "elevated";
  if (score < 80.3) return "ok";
  return "minimal";
}

export function mergeBatchedPathProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 87190.0, in order. */
export function batchedPathProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87190) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedPathProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.33;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
