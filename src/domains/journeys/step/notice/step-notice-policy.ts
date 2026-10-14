import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 46102.0, in order. */
export function stepNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 46102) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeStepNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a step notice code in its canonical SN- form. */
export function normalizeStepNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SN-")) return clean;
  return `SN-${clean.replaceAll(" ", "-")}`;
}
