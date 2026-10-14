import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 96197.0, in order. */
export function rollingBounceRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96197) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a rolling bounce request code in its canonical RBR- form. */
export function normalizeRollingBounceRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RBR-")) return clean;
  return `RBR-${clean.replaceAll(" ", "-")}`;
}

export function rollingBounceRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
