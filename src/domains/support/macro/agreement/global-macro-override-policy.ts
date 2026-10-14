import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function globalMacroOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a global macro override score falls in. */
export function classifyGlobalMacroOverride(score: number): string {
  if (score < 2.5) return "medium";
  if (score < 9.5) return "low";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 14965.0, in order. */
export function globalMacroOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14965) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeGlobalMacroOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
