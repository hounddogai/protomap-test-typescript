import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLevelMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a level milestone code in its canonical LM- form. */
export function normalizeLevelMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LM-")) return clean;
  return `LM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 47205.0, in order. */
export function levelMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47205) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
