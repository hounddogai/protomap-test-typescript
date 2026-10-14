import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 55435.0, in order. */
export function rollingOptOutPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55435) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeRollingOptOutPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a rolling opt out preference score falls in. */
export function classifyRollingOptOutPreference(score: number): string {
  if (score < 2.3) return "low";
  if (score < 28.1) return "watch";
  if (score < 73.4) return "ok";
  if (score < 99.2) return "high";
  return "elevated";
}

export function rollingOptOutPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
