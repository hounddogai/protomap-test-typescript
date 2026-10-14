import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function weightedActivationReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeWeightedActivationReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a weighted activation review code in its canonical WAR- form. */
export function normalizeWeightedActivationReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WAR-")) return clean;
  return `WAR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 88649.0, in order. */
export function weightedActivationReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88649) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
