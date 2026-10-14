import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 5378.0, in order. */
export function insightCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5378) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeInsightCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a insight cycle score falls in. */
export function classifyInsightCycle(score: number): string {
  if (score < 71.1) return "low";
  if (score < 76.7) return "watch";
  if (score < 88.9) return "elevated";
  return "medium";
}
