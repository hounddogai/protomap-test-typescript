import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a window override code in its canonical WO- form. */
export function normalizeWindowOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WO-")) return clean;
  return `WO-${clean.replaceAll(" ", "-")}`;
}

export function mergeWindowOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 71708.0, in order. */
export function windowOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71708) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
