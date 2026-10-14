import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 12237.0, in order. */
export function csatBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12237) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeCsatBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function csatBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a csat bundle score falls in. */
export function classifyCsatBundle(score: number): string {
  if (score < 32.7) return "elevated";
  if (score < 34.7) return "minimal";
  if (score < 42) return "high";
  if (score < 86.1) return "medium";
  return "ok";
}
