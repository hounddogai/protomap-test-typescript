import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeGlobalPacingReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 55677.0, in order. */
export function globalPacingReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55677) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a global pacing review code in its canonical GPR- form. */
export function normalizeGlobalPacingReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GPR-")) return clean;
  return `GPR-${clean.replaceAll(" ", "-")}`;
}
