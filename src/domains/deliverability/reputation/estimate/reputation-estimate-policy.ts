import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 70913.0, in order. */
export function reputationEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70913) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeReputationEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a reputation estimate code in its canonical RE- form. */
export function normalizeReputationEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RE-")) return clean;
  return `RE-${clean.replaceAll(" ", "-")}`;
}
