import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function tieredActivationDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered activation digest code in its canonical TAD- form. */
export function normalizeTieredActivationDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TAD-")) return clean;
  return `TAD-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredActivationDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 50215.0, in order. */
export function tieredActivationDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50215) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
