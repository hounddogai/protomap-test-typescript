import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a bounce claim code in its canonical BC- form. */
export function normalizeBounceClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BC-")) return clean;
  return `BC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 23869.0, in order. */
export function bounceClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23869) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeBounceClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
