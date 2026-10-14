import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function reputationBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 11444.0, in order. */
export function reputationBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11444) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeReputationBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
