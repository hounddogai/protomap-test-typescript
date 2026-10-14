import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 57052.0, in order. */
export function frequencyPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57052) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeFrequencyPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a frequency plan code in its canonical FP- form. */
export function normalizeFrequencyPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FP-")) return clean;
  return `FP-${clean.replaceAll(" ", "-")}`;
}

export function frequencyPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.66;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
