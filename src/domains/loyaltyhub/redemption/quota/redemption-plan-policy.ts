import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function redemptionPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function mergeRedemptionPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a redemption plan code in its canonical RP- form. */
export function normalizeRedemptionPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RP-")) return clean;
  return `RP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 26431.0, in order. */
export function redemptionPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26431) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
