import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 75095.0, in order. */
export function fallbackDoubleOptInBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75095) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fallback double opt in batch score falls in. */
export function classifyFallbackDoubleOptInBatch(score: number): string {
  if (score < 10.2) return "watch";
  if (score < 39.7) return "elevated";
  if (score < 42) return "low";
  if (score < 42.3) return "medium";
  return "ok";
}

export function fallbackDoubleOptInBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function mergeFallbackDoubleOptInBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
