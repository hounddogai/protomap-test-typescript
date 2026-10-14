import * as numbers from "../../../../kit/numbers.js";

export function macroDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 34944.0, in order. */
export function macroDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34944) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function macroDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a macro draft code in its canonical MD- form. */
export function normalizeMacroDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MD-")) return clean;
  return `MD-${clean.replaceAll(" ", "-")}`;
}
