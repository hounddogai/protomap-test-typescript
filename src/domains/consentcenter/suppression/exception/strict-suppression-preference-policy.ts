import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a strict suppression preference code in its canonical SSP- form. */
export function normalizeStrictSuppressionPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSP-")) return clean;
  return `SSP-${clean.replaceAll(" ", "-")}`;
}

export function mergeStrictSuppressionPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 95444.0, in order. */
export function strictSuppressionPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95444) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
