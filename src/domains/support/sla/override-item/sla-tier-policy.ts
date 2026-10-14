import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a sla tier code in its canonical ST- form. */
export function normalizeSlaTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ST-")) return clean;
  return `ST-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 79435.0, in order. */
export function slaTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79435) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeSlaTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
