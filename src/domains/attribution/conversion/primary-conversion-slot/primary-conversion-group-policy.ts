import * as numbers from "../../../../kit/numbers.js";

export function primaryConversionGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 55180.0, in order. */
export function primaryConversionGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55180) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryConversionGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a primary conversion group code in its canonical PCG- form. */
export function normalizePrimaryConversionGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCG-")) return clean;
  return `PCG-${clean.replaceAll(" ", "-")}`;
}
