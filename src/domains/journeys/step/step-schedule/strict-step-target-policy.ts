import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 99844.0, in order. */
export function strictStepTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99844) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a strict step target code in its canonical SST- form. */
export function normalizeStrictStepTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SST-")) return clean;
  return `SST-${clean.replaceAll(" ", "-")}`;
}

export function mergeStrictStepTargetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
