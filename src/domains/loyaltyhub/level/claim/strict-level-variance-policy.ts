import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictLevelVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a strict level variance code in its canonical SLV- form. */
export function normalizeStrictLevelVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SLV-")) return clean;
  return `SLV-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 81610.0, in order. */
export function strictLevelVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81610) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
