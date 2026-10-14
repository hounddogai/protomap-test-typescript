import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a redemption cycle code in its canonical RC- form. */
export function normalizeRedemptionCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RC-")) return clean;
  return `RC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 49161.0, in order. */
export function redemptionCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49161) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function redemptionCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergeRedemptionCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
