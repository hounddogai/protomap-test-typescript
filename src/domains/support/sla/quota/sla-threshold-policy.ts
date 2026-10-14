import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a sla threshold code in its canonical ST- form. */
export function normalizeSlaThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ST-")) return clean;
  return `ST-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 47705.0, in order. */
export function slaThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47705) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeSlaThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function slaThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
