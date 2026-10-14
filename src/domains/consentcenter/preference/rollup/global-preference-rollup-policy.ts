import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeGlobalPreferenceRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a global preference rollup score falls in. */
export function classifyGlobalPreferenceRollup(score: number): string {
  if (score < 22.1) return "critical";
  if (score < 27.7) return "medium";
  if (score < 40.5) return "ok";
  return "low";
}

export function globalPreferenceRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 88130.0, in order. */
export function globalPreferenceRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88130) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
