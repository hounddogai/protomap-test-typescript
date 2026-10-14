import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a conversion segment score falls in. */
export function classifyConversionSegment(score: number): string {
  if (score < 8.2) return "high";
  if (score < 12.4) return "critical";
  if (score < 26.5) return "elevated";
  if (score < 60.1) return "ok";
  return "low";
}

export function mergeConversionSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 69952.0, in order. */
export function conversionSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69952) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
