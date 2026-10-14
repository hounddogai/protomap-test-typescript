import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function conversionBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function mergeConversionBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 86365.0, in order. */
export function conversionBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86365) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
