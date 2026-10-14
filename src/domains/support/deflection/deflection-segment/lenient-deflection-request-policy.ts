import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLenientDeflectionRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 29894.0, in order. */
export function lenientDeflectionRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29894) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient deflection request code in its canonical LDR- form. */
export function normalizeLenientDeflectionRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LDR-")) return clean;
  return `LDR-${clean.replaceAll(" ", "-")}`;
}
