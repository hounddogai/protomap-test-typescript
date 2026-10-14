import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedPlacementEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 45299.0, in order. */
export function weightedPlacementEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45299) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedPlacementEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Puts a weighted placement estimate code in its canonical WPE- form. */
export function normalizeWeightedPlacementEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPE-")) return clean;
  return `WPE-${clean.replaceAll(" ", "-")}`;
}
