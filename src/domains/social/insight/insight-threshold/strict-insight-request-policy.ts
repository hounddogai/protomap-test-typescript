import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 81135.0, in order. */
export function strictInsightRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81135) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeStrictInsightRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a strict insight request code in its canonical SIR- form. */
export function normalizeStrictInsightRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIR-")) return clean;
  return `SIR-${clean.replaceAll(" ", "-")}`;
}
