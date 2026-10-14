import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeDoubleOptInRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 42903.0, in order. */
export function doubleOptInRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42903) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function doubleOptInRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a double opt in rollup code in its canonical DOIR- form. */
export function normalizeDoubleOptInRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIR-")) return clean;
  return `DOIR-${clean.replaceAll(" ", "-")}`;
}
