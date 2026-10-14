import * as numbers from "../../../../kit/numbers.js";

/** Puts a primary conversion rule code in its canonical PCR- form. */
export function normalizePrimaryConversionRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCR-")) return clean;
  return `PCR-${clean.replaceAll(" ", "-")}`;
}

export function primaryConversionRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 2296.0, in order. */
export function primaryConversionRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2296) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryConversionRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
