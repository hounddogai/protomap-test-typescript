import * as numbers from "../../../../kit/numbers.js";

/** Puts a primary path record code in its canonical PPR- form. */
export function normalizePrimaryPathRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPR-")) return clean;
  return `PPR-${clean.replaceAll(" ", "-")}`;
}

export function primaryPathRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 91647.0, in order. */
export function primaryPathRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91647) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
