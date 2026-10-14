import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeInsightOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a insight override code in its canonical IO- form. */
export function normalizeInsightOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IO-")) return clean;
  return `IO-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 50303.0, in order. */
export function insightOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50303) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
