import * as numbers from "../../../../kit/numbers.js";

export function levelBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 5146.0, in order. */
export function levelBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5146) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a level baseline code in its canonical LB- form. */
export function normalizeLevelBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LB-")) return clean;
  return `LB-${clean.replaceAll(" ", "-")}`;
}

export function levelBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
