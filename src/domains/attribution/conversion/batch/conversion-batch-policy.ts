import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function conversionBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 36556.0, in order. */
export function conversionBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36556) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a conversion batch code in its canonical CB- form. */
export function normalizeConversionBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CB-")) return clean;
  return `CB-${clean.replaceAll(" ", "-")}`;
}

export function mergeConversionBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
