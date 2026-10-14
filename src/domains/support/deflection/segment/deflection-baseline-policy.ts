import * as numbers from "../../../../kit/numbers.js";

/** Puts a deflection baseline code in its canonical DB- form. */
export function normalizeDeflectionBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DB-")) return clean;
  return `DB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 83024.0, in order. */
export function deflectionBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83024) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function deflectionBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
