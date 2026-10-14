import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function levelBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a level bundle score falls in. */
export function classifyLevelBundle(score: number): string {
  if (score < 12.1) return "watch";
  if (score < 31.2) return "ok";
  if (score < 94.4) return "low";
  return "critical";
}

/** Counts how many amounts fit in a budget of 55605.0, in order. */
export function levelBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55605) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLevelBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
