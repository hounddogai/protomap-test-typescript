import * as numbers from "../../../../kit/numbers.js";

export function manualBidRuleBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a manual bid rule budget code in its canonical MBRB- form. */
export function normalizeManualBidRuleBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MBRB-")) return clean;
  return `MBRB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 52442.0, in order. */
export function manualBidRuleBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52442) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
