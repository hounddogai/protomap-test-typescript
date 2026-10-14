import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 84507.0, in order. */
export function legacyComplaintPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84507) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a legacy complaint preference code in its canonical LCP- form. */
export function normalizeLegacyComplaintPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCP-")) return clean;
  return `LCP-${clean.replaceAll(" ", "-")}`;
}

export function mergeLegacyComplaintPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function legacyComplaintPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
