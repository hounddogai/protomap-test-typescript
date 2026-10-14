import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingRewardPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 2460.0, in order. */
export function rollingRewardPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2460) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a rolling reward preference code in its canonical RRP- form. */
export function normalizeRollingRewardPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRP-")) return clean;
  return `RRP-${clean.replaceAll(" ", "-")}`;
}
