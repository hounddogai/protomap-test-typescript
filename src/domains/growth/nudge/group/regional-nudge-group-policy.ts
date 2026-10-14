import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional nudge group code in its canonical RNG- form. */
export function normalizeRegionalNudgeGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RNG-")) return clean;
  return `RNG-${clean.replaceAll(" ", "-")}`;
}

export function regionalNudgeGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 848.0, in order. */
export function regionalNudgeGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 848) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
