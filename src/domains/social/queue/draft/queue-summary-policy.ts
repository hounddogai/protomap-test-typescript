import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a queue summary code in its canonical QS- form. */
export function normalizeQueueSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QS-")) return clean;
  return `QS-${clean.replaceAll(" ", "-")}`;
}

export function mergeQueueSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 10922.0, in order. */
export function queueSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10922) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function queueSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
