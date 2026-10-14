import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function weightedRetentionGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 64809.0, in order. */
export function weightedRetentionGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64809) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a weighted retention group code in its canonical WRG- form. */
export function normalizeWeightedRetentionGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRG-")) return clean;
  return `WRG-${clean.replaceAll(" ", "-")}`;
}

export function mergeWeightedRetentionGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
