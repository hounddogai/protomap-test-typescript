import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRedemptionRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 72783.0, in order. */
export function redemptionRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72783) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a redemption request code in its canonical RR- form. */
export function normalizeRedemptionRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}
