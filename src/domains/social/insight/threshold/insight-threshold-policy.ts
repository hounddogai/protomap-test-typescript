import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 75993.0, in order. */
export function insightThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75993) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a insight threshold code in its canonical IT- form. */
export function normalizeInsightThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IT-")) return clean;
  return `IT-${clean.replaceAll(" ", "-")}`;
}

export function mergeInsightThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
