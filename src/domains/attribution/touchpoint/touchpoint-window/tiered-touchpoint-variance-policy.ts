import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a tiered touchpoint variance code in its canonical TTV- form. */
export function normalizeTieredTouchpointVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TTV-")) return clean;
  return `TTV-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredTouchpointVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 63822.0, in order. */
export function tieredTouchpointVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63822) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
