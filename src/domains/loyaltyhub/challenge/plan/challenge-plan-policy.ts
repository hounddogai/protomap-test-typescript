import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeChallengePlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a challenge plan code in its canonical CP- form. */
export function normalizeChallengePlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CP-")) return clean;
  return `CP-${clean.replaceAll(" ", "-")}`;
}

export function challengePlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 23602.0, in order. */
export function challengePlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23602) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
