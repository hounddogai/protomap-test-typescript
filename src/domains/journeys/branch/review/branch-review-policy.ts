import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBranchReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a branch review code in its canonical BR- form. */
export function normalizeBranchReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BR-")) return clean;
  return `BR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 66030.0, in order. */
export function branchReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66030) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
