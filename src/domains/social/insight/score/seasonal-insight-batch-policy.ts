import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a seasonal insight batch code in its canonical SIB- form. */
export function normalizeSeasonalInsightBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIB-")) return clean;
  return `SIB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 65659.0, in order. */
export function seasonalInsightBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65659) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeSeasonalInsightBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function seasonalInsightBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
