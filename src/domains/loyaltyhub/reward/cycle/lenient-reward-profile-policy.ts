import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient reward profile code in its canonical LRP- form. */
export function normalizeLenientRewardProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRP-")) return clean;
  return `LRP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 76252.0, in order. */
export function lenientRewardProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76252) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientRewardProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
