import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function cappedFlightGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeCappedFlightGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 11967.0, in order. */
export function cappedFlightGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11967) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a capped flight group code in its canonical CFG- form. */
export function normalizeCappedFlightGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CFG-")) return clean;
  return `CFG-${clean.replaceAll(" ", "-")}`;
}
