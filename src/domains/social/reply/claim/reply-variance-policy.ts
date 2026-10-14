import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function replyVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 58067.0, in order. */
export function replyVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58067) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reply variance code in its canonical RV- form. */
export function normalizeReplyVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RV-")) return clean;
  return `RV-${clean.replaceAll(" ", "-")}`;
}

export function mergeReplyVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
