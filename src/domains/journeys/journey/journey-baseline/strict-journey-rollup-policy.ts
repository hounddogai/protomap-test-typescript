import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict journey rollup code in its canonical SJR- form. */
export function normalizeStrictJourneyRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SJR-")) return clean;
  return `SJR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 83022.0, in order. */
export function strictJourneyRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83022) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictJourneyRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
