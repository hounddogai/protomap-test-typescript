import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedFrequencyMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 49059.0, in order. */
export function batchedFrequencyMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49059) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a batched frequency metric code in its canonical BFM- form. */
export function normalizeBatchedFrequencyMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BFM-")) return clean;
  return `BFM-${clean.replaceAll(" ", "-")}`;
}
