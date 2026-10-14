import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a legacy bounce forecast code in its canonical LBF- form. */
export function normalizeLegacyBounceForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LBF-")) return clean;
  return `LBF-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 1926.0, in order. */
export function legacyBounceForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1926) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function legacyBounceForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function mergeLegacyBounceForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
