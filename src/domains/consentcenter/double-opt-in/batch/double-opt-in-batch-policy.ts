import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 56658.0, in order. */
export function doubleOptInBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56658) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function doubleOptInBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a double opt in batch score falls in. */
export function classifyDoubleOptInBatch(score: number): string {
  if (score < 30.8) return "high";
  if (score < 40.6) return "minimal";
  if (score < 82.6) return "medium";
  return "critical";
}

export function mergeDoubleOptInBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
