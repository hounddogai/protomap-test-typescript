import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a scheduled post rollup code in its canonical SPR- form. */
export function normalizeScheduledPostRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPR-")) return clean;
  return `SPR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 59711.0, in order. */
export function scheduledPostRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59711) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeScheduledPostRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
