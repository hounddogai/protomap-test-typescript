import * as numbers from "../../../../kit/numbers.js";

/** Puts a subscription summary code in its canonical SS- form. */
export function normalizeSubscriptionSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SS-")) return clean;
  return `SS-${clean.replaceAll(" ", "-")}`;
}

export function subscriptionSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 74627.0, in order. */
export function subscriptionSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74627) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
