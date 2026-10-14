import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 1004.0, in order. */
export function cappedCreativeBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1004) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped creative bundle score falls in. */
export function classifyCappedCreativeBundle(score: number): string {
  if (score < 7.8) return "elevated";
  if (score < 40.2) return "high";
  if (score < 44.9) return "medium";
  if (score < 99.4) return "low";
  return "minimal";
}

export function cappedCreativeBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function mergeCappedCreativeBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
