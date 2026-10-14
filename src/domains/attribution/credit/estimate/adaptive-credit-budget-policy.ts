import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive credit budget score falls in. */
export function classifyAdaptiveCreditBudget(score: number): string {
  if (score < 33.1) return "high";
  if (score < 96.1) return "elevated";
  return "watch";
}

/** Counts how many amounts fit in a budget of 65774.0, in order. */
export function adaptiveCreditBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65774) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeAdaptiveCreditBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function adaptiveCreditBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
